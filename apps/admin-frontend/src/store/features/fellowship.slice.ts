import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { CouncilFellowshipState } from "../../types/store/state.type";
import api from "../../api/axios";
import { NewCouncilFellowship } from "../../types/model/fellowship.model";
import { FellowshipQuery } from "../../types/query/query-params.type";

const initialState: CouncilFellowshipState = {
  fellowships: [],
  fellowship: null,
  status: "idle",
  task: "",
  total: 1,
  page: 1,
  limit: 10,
};

export const fetchFellowships = createAsyncThunk(
  "fellowship/fetchFellowships",
  async ({ page = 1, limit = 10, state }: FellowshipQuery, thunkAPI) => {
    try {
      const queryParams: any = {
        _page: page,
        _limit: limit,
      };
      if (state) queryParams.state = state;
      const response = await api.get(`/council-fellowship`, {
        params: queryParams,
      });
      const data = response.data.data;
      return { fellowships: data.fellowships };
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

export const fetchFellowship = createAsyncThunk(
  "fellowship/fetchFellowship",
  async (id: string, thunkAPI) => {
    try {
      const response = await api.get(`/council-fellowship/${id}`);
      const data = response.data.data;
      return { fellowship: data.fellowship };
    } catch (error) {
      console.error(error);
      return thunkAPI.rejectWithValue("Failed to fetch fellowship");
    }
  }
);

export const createFellowship = createAsyncThunk(
  "member/createFellowship",
  async (
    {
      newFellowship,
      files,
      closeModal,
    }: { newFellowship: NewCouncilFellowship; files?: File[]; closeModal: () => void },
    thunkAPI
  ) => {
    try {
      const formData = new FormData();
      
      // Handle certificateIssuedDate conversion
      if (newFellowship.certificateIssuedDate) {
        const date = newFellowship.certificateIssuedDate;
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        //@ts-ignore
        newFellowship.certificateIssuedDate = `${year}-${month}-${day}`;
      }

      // Append fellowship fields to FormData
      Object.keys(newFellowship).forEach(key => {
        const formValue = newFellowship[key as keyof NewCouncilFellowship];
        if (key === 'boardMembers') {
            formData.append(key, JSON.stringify(formValue));
        } else if (formValue !== null && formValue !== undefined) {
            formData.append(key, String(formValue));
        }
      });

      // Append files
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }

      const res = await api.post(`/council-fellowship`, formData);
      closeModal();
      toast.success("Fellowship added successfully");
      const data = res.data.data;
      return {
        fellowship: data.fellowship,
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

export const updateFellowship = createAsyncThunk(
  "fellowship/updateFellowship",
  async (
    {
      id,
      updatedFellowship,
      closeModal,
    }: {
      id: string;
      updatedFellowship: NewCouncilFellowship;
      closeModal: () => void;
    },
    thunkAPI
  ) => {
    try {
      if (updatedFellowship.certificateIssuedDate) {
        const date = updatedFellowship.certificateIssuedDate;
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        //@ts-ignore
        updatedFellowship.certificateIssuedDate = `${year}-${month}-${day}`;
      }
      const res = await api.patch(
        `/council-fellowship/${id}`,
        updatedFellowship
      );
      closeModal();
      toast.success("Fellowship updated successfully");
      const data = res.data.data;
      return {
        fellowship: data.fellowship,
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

export const FellowshipSlice = createSlice({
  name: "fellowship",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFellowships.fulfilled, (state, action) => {
        state.fellowships = action.payload.fellowships;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchFellowships.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-fellowships";
      })
      .addCase(fetchFellowships.rejected, (state) => {
        state.fellowships = [];
        state.task = "";
        state.status = "failed";
      })
      .addCase(fetchFellowship.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-fellowship";
      })
      .addCase(fetchFellowship.fulfilled, (state, action) => {
        state.fellowship = action.payload.fellowship;
        state.status = "idle";
        state.task = "";
      })
      .addCase(fetchFellowship.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createFellowship.pending, (state) => {
        state.status = "loading";
        state.task = "create-fellowship";
      })
      .addCase(createFellowship.fulfilled, (state, action) => {
        state.fellowships.push(action.payload.fellowship);
        state.status = "idle";
        state.task = "";
      })
      .addCase(createFellowship.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(updateFellowship.fulfilled, (state, action) => {
        state.fellowships = state.fellowships.map((fellowship) => {
          if (fellowship.id === action.payload.fellowship.id) {
            return action.payload.fellowship;
          }
          return fellowship;
        });
        state.status = "idle";
        state.task = "";
      })
      .addCase(updateFellowship.pending, (state) => {
        state.status = "loading";
        state.task = "update-fellowship";
      })
      .addCase(updateFellowship.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default FellowshipSlice.reducer;
export const {} = FellowshipSlice.actions;
