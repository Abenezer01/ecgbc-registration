import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { MemberState } from "../../types/store/state.type";
import api from "../../api/axios";
import { NewMember } from "../../types/model/member.model";
import { MembersQuery } from "../../types/query/query-params.type";
import { UseNavigateResult } from "@tanstack/react-router";

const emitInactiveCountRefresh = (delta: number) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("inactive-count-refresh", { detail: { delta } }));
  }
};

const initialState: MemberState = {
  members: [],
  member: null,
  status: "idle",
  task: "",
  error: null,
  total: 1,
  page: 1,
  limit: 10,
};
let abortController: AbortController | null = null;

export const fetchMembers = createAsyncThunk(
  "member/fetchMembers",
  async (
    {
      page = 1,
      limit = 10,
      state,
      search,
      regionId,
      typeId,
      councilFellowshipId,
      isInEthiopia,
      reportStatus,
      reportYear,
      filterByReport,
      memberTypeChanged
    }: MembersQuery,
    thunkAPI
  ) => {
    try {
      const queryParams: any = {
        _page: page,
        _limit: limit,
      };
      if (state && state !== "all") queryParams.stateId = state;
      if (regionId && regionId !== "all") queryParams.regionId = regionId;
      if (typeId && typeId !== "all") queryParams.typeId = typeId;
      if (isInEthiopia && isInEthiopia !== "all")
        queryParams.isInEthiopia = isInEthiopia;
      if (search) queryParams._search = search;
      if (councilFellowshipId && councilFellowshipId !== "all")
        queryParams.councilFellowshipId = councilFellowshipId;
      if(filterByReport) {
        queryParams.filterByReport = filterByReport;
        if (reportStatus && reportStatus !== "all")  queryParams.reportStatus = reportStatus;
        queryParams.reportYear = reportYear;
      }
      if(memberTypeChanged) {
        if (memberTypeChanged && memberTypeChanged !== "all")  queryParams.memberTypeChanged = memberTypeChanged;
        queryParams.memberTypeChanged = memberTypeChanged;
      }
      if (abortController) {
        abortController.abort(); // Cancel previous request
      }
      abortController = new AbortController();
      const response = await api.get(`/members`, { params: queryParams });
      const data = response.data.data;
      return { members: data.members, meta: data.meta };
    } catch (error) {
      let errors: any = [];
      if (isAxiosError(error)) {
        errors = error.response?.data.errors;
      } else {
        errors = error && error.toString();
      }
      console.error(error);
      return thunkAPI.rejectWithValue(errors);
    }
  }
);

export const fetchMember = createAsyncThunk(
  "member/fetchMember",
  async (id: string, thunkAPI) => {
    try {
      const response = await api.get(`/members/${id}`);
      const data = response.data.data;
      if (!data || !data.member) {
        throw new Error('Invalid response structure: member data not found');
      }
      return { member: data.member };
    } catch (error) {
      let errors: any = [];
      if (isAxiosError(error)) {
        errors = error.response?.data.errors;
      } else {
        errors = error && error.toString();
      }
      console.error('fetchMember error:', error);
      return thunkAPI.rejectWithValue(errors);
    }
  }
);

export const createMember = createAsyncThunk(
  "member/createMember",
  async (
    {
      newMember,
      files,
      navigate,
    }: { newMember: NewMember;files:File[], navigate: UseNavigateResult<string> },
    thunkAPI
  ) => {
    try {
      console.log('newMember',newMember);
      
      const formData = new FormData();
      Object.keys(newMember).forEach(key => {
        const formValue = newMember[key as keyof NewMember];
        console.log('key',key);
        console.log('formValue',formValue);
        if (key === 'boardMembers') {
            formData.append(key, JSON.stringify(formValue));
        }else if(key == 'certificateIssuedDate'){
          const date = new Date(formValue as string);
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          formData.append(key, formattedDate);
        } else if (formValue !== null && formValue !== undefined) {
            formData.append(key, String(formValue));
        }
    });

    files.forEach(file => {
        formData.append('memberFiles', file);
    });
      const res = await api.post(`/members`, formData);
      navigate({ to: "/members/$id",params:{
        id: res.data.data.member.id,
      } });
      toast.success("Member added successfully");
      const data = res.data.data;
      return {
        member: data.member,
      };
    } catch (error) {
      let errors: any = [];
      if (isAxiosError(error)) {
        errors = error.response?.data.errors;
        if (errors) {
          //@ts-ignore
          errors.forEach((error) => toast.error(error.msg));
        } else {
          const message = error.response?.data.message;
          toast.error(message);
        }
      } else {
        errors = error && error.toString();
      }
      console.error(error);
      return thunkAPI.rejectWithValue(errors);
    }
  }
);

export const updateMember = createAsyncThunk(
  "member/updateMember",
  async (
    {
      id,
      updatedMember,
      closeModal,
    }: { id: string; updatedMember: NewMember; closeModal: () => void },
    thunkAPI
  ) => {
    try {
      if (updatedMember.certificateIssuedDate) {
          const parsed = new Date(updatedMember.certificateIssuedDate);
          
          const year = parsed.getFullYear();
          const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
          const day = parsed.getDate().toString().padStart(2, '0');
          // @ts-ignore
          updatedMember.certificateIssuedDate = `${year}-${month}-${day}`;
      }
      
      const res = await api.patch(`/members/${id}`, updatedMember);
      closeModal();
      toast.success("Member updated successfully");
      const data = res.data.data;
      return {
        member: data.member,
      };
    } catch (error) {
      let errors: any = [];
      if (isAxiosError(error)) {
        console.log("error.response");
        console.log(error.response);
        errors = error.response?.data.errors;
        if (errors) {
          //@ts-ignore
          errors.forEach((error) => toast.error(error.msg));
        } else {
          const message = error.response?.data.message;
          toast.error(message);
        }
      } else {
        errors = error && error.toString();
      }
      console.error(error);
      return thunkAPI.rejectWithValue(errors);
    }
  }
);

export const inactiveMember = createAsyncThunk(
  "member/inactiveMember",
  async (
    {
      id,
      reason,
      closeModal,
    }: { id: string; reason: string; closeModal: () => void },
    thunkAPI
  ) => {
    try {
      const res = await api.patch(`/members/${id}/inactive`, { reason });
      closeModal();
      toast.success("Member updated successfully");
      const data = res.data.data;
      return {
        member: data.member,
      };
    } catch (error) {
      let errors: any = [];
      if (isAxiosError(error)) {
        console.log("error.response");
        console.log(error.response);
        errors = error.response?.data.errors;
        if (errors) {
          //@ts-ignore
          errors.forEach((error) => toast.error(error.msg));
        } else {
          const message = error.response?.data.message;
          toast.error(message);
        }
      } else {
        errors = error && error.toString();
      }
      console.error(error);
      return thunkAPI.rejectWithValue(errors);
    }
  }
);

export const activeMember = createAsyncThunk(
  "member/activeMember",
  async (
    { id, closeModal }: { id: string; closeModal: () => void },
    thunkAPI
  ) => {
    try {
      const res = await api.patch(`/members/${id}/active`);
      closeModal();
      toast.success("Member updated successfully");
      const data = res.data.data;
      return {
        member: data.member,
      };
    } catch (error) {
      let errors: any = [];
      if (isAxiosError(error)) {
        console.log("error.response");
        console.log(error.response);
        errors = error.response?.data.errors;
        if (errors) {
          //@ts-ignore
          errors.forEach((error) => toast.error(error.msg));
        } else {
          const message = error.response?.data.message;
          toast.error(message);
        }
      } else {
        errors = error && error.toString();
      }
      console.error(error);
      return thunkAPI.rejectWithValue(errors);
    }
  }
);
export const MemberSlice = createSlice({
  name: "member",
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.members = action.payload.members;
        state.page = action.payload.meta.page;
        state.limit = action.payload.meta.limit;
        state.total = action.payload.meta.total;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchMembers.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-members";
      })
      .addCase(fetchMembers.rejected, (state) => {
        state.status = "failed";
        state.error = "Failed to fetch members";
      })
      .addCase(fetchMember.fulfilled, (state, action) => {
        state.member = action.payload.member;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchMember.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-member";
      })
      .addCase(fetchMember.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string || "Failed to fetch member";
      })
      .addCase(createMember.pending, (state) => {
        state.status = "loading";
        state.task = "create-member";
      })
      .addCase(createMember.fulfilled, (state, action) => {
        state.members.push(action.payload.member);
        state.status = "idle";
        state.task = "";
      })
      .addCase(createMember.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(updateMember.fulfilled, (state, action) => {
        state.member = action.payload.member;
        state.status = "idle";
        state.task = "";
      })
      .addCase(updateMember.pending, (state) => {
        state.status = "loading";
        state.task = "update-member";
      })
      .addCase(updateMember.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(inactiveMember.fulfilled, (state, action) => {
        state.member = action.payload.member;
  emitInactiveCountRefresh(1);
        state.status = "idle";
        state.task = "";
      })
      .addCase(inactiveMember.pending, (state) => {
        state.status = "loading";
        state.task = "update-member";
      })
      .addCase(inactiveMember.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(activeMember.fulfilled, (state, action) => {
        state.member = action.payload.member;
  emitInactiveCountRefresh(-1);
        state.status = "idle";
        state.task = "";
      })
      .addCase(activeMember.pending, (state) => {
        state.status = "loading";
        state.task = "update-member";
      })
      .addCase(activeMember.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default MemberSlice.reducer;
export const {} = MemberSlice.actions;
