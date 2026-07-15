import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { StaffState } from "../../types/store/state.type";
import api from "../../api/axios";
import { NewStaff } from "../../types/model/staff.model";
import { StaffsQuery } from "../../types/query/query-params.type";

const initialState: StaffState = {
  staffs: [],
  staff: null,
  status: "idle",
  task: "",
  total: 1,
  page: 1,
  limit: 10,
};

export const fetchStaffs = createAsyncThunk(
  "staff/fetchStaffs",
  async ({ page = 1, limit = 10, state }: StaffsQuery, thunkAPI) => {
    try {
      const queryParams: any = {
        _page: page,
        _limit: limit,
      };
      if (state) queryParams.state = state;
      const response = await api.get(`/staff`,{params:queryParams});
      const data = response.data.data;
      return { staffs: data.staffs,meta: data.meta };
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

export const createStaff = createAsyncThunk(
    "staff/createStaff",
    async (
      {  newStaff,closeCreateStaff }: {  newStaff: NewStaff,closeCreateStaff:() => void },
      thunkAPI
    ) => {
      const formData = new FormData();
  
      formData.append("firstName", newStaff.firstName);
      formData.append("lastName", newStaff.lastName);
      formData.append("email", newStaff.email);
      formData.append("password", newStaff.password);
     if(newStaff.roleId) formData.append("roleId", newStaff.roleId);
     if(newStaff.stateId) formData.append("stateId", newStaff.stateId);
      if (newStaff.phoneNumber)
        formData.append("phoneNumber", newStaff.phoneNumber);
      if (newStaff.avatar)
        formData.append("avatar", newStaff.avatar);
      try {
        const res = await api.post(`/staff`, formData);
        closeCreateStaff()
        toast.success("Staff added successfully");
        const data = res.data.data;
        return {
          staff: data.staff
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

export const updateStaff = createAsyncThunk(
  "staff/updateStaff",
  async (
    { id, updatedStaff,closeEditStaff }: { id: string; updatedStaff: NewStaff,closeEditStaff:() => void },
    thunkAPI
  ) => {
    const formData = new FormData();

    formData.append("firstName", updatedStaff.firstName);
    formData.append("lastName", updatedStaff.lastName);
    formData.append("email", updatedStaff.email);
    if(updatedStaff.roleId) formData.append("roleId", updatedStaff.roleId);
    if(updatedStaff.stateId) formData.append("stateId", updatedStaff.stateId);
    if (updatedStaff.phoneNumber)
      formData.append("phoneNumber", updatedStaff.phoneNumber);
    if (updatedStaff.password)
      formData.append("password", updatedStaff.password);
    if (updatedStaff.avatar && typeof updatedStaff.avatar === "object")
      formData.append("avatar", updatedStaff.avatar);
    try {
      const res = await api.patch(`/staff/${id}`, formData);
      closeEditStaff()
      toast.success("Staff updated successfully");
      const data = res.data.data;
      return {
        staff: data.staff
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

export const StaffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffs.fulfilled, (state, action) => {
        state.staffs = action.payload.staffs;
        state.page = action.payload.meta.page;
        state.limit = action.payload.meta.limit;
        state.total = action.payload.meta.total;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchStaffs.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-staffs";
      })
      .addCase(fetchStaffs.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createStaff.pending, (state) => {
        state.status = "loading";
        state.task = "create-staff";
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.staffs.push(action.payload.staff)
       
        state.total = state.total+1;
        state.status = "idle";
        state.task = "";
      })
      .addCase(createStaff.rejected, (state) => {
        state.status = "failed";
        
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.staffs = state.staffs.map(staff=>{
            if(staff.id === action.payload.staff.id){
                return action.payload.staff
            }
            return staff
        });
        state.status = "idle";
        state.task = "";
      })
      .addCase(updateStaff.pending, (state) => {
        state.status = "loading";
        state.task = "update-staff";
      })
      .addCase(updateStaff.rejected, (state) => {
        state.status = "failed";
        
      });
  },
});

export default StaffSlice.reducer;
export const {} = StaffSlice.actions;
