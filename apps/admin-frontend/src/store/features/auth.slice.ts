import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { AuthState } from "../../types/store/state.type";
import setAuthToken from "../../api/auth";
import api from "../../api/axios";
import { NewStaff } from "../../types/model/staff.model";

const initialState: AuthState = {
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  status: "idle",
  task: "",
  staff: null,
  rbac: null,
  dashboardStat: null,
};

export const fetchAuthenticatedStaff = createAsyncThunk(
  "auth/fetch",
  async (_, thunkAPI) => {
    try {
      if (localStorage.token) {
        setAuthToken(localStorage.token);
      }
      const response = await api.get(`/auth`);
      const data = response.data.data;
      return { staff: data.staff, rbac: data.rbac };
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

type LoginValues = {
  email: string;
  password: string;
};
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginValues, thunkAPI) => {
    try {
      const res = await api.post(`/auth/login`, credentials, {
        headers: { "Content-Type": "application/json" },
      });
      const data = res.data.data;
      setAuthToken(data.accessToken);
      return {
        staff: data.staff,
        accessToken: data.accessToken,
        rbac: data.rbac,
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

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    { id, updatedStaff }: { id: string; updatedStaff: NewStaff },
    thunkAPI
  ) => {
    const formData = new FormData();

    formData.append("firstName", updatedStaff.firstName);
    formData.append("lastName", updatedStaff.lastName);
    formData.append("email", updatedStaff.email);
    if (updatedStaff.phoneNumber)
      formData.append("phoneNumber", updatedStaff.phoneNumber);
    if (updatedStaff.avatar && typeof updatedStaff.avatar === "object")
      formData.append("avatar", updatedStaff.avatar);
    try {
      const res = await api.patch(`/staff/update/${id}`, formData);
      toast.success("Profile updated successfully");
      const data = res.data.data;
      return {
        staff: data.staff,
        accessToken: data.accessToken,
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

export const getDashboardStat = createAsyncThunk(
  "auth/getDashboardStat",
  async (_, thunkAPI) => {
    try {
      const response = await api.get(`/auth/stat`);
      const data = response.data.data;
      return { stat: data.stat };
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
export const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token");
      state.token = null;
      state.isAuthenticated = false;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthenticatedStaff.fulfilled, (state, action) => {
        state.staff = action.payload.staff;
        state.rbac = action.payload.rbac;
        state.isAuthenticated = true;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchAuthenticatedStaff.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-authenticated-staf";
      })
      .addCase(fetchAuthenticatedStaff.rejected, (state) => {
        localStorage.removeItem("token");
        state.token = null;
        state.status = "failed";
        state.isAuthenticated = false;
        state.staff = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        localStorage.setItem("token", action.payload.accessToken);
        state.token = action.payload.accessToken;
        state.staff = action.payload.staff;
        state.rbac = action.payload.rbac;
        state.isAuthenticated = true;
        state.status = "idle";
        state.task = "";
      })
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.task = "login";
      })
      .addCase(login.rejected, (state) => {
        state.status = "failed";
        state.isAuthenticated = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.staff = action.payload.staff;
        state.status = "idle";
        state.task = "";
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = "loading";
        state.task = "update-profile";
      })
      .addCase(updateProfile.rejected, (state) => {
        state.status = "failed";
        state.isAuthenticated = false;
      })
      .addCase(getDashboardStat.fulfilled, (state, action) => {
        state.dashboardStat = action.payload.stat;
        state.task = "";
        state.status = "idle";
      })
      .addCase(getDashboardStat.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-dashboard-stat";
      })
      .addCase(getDashboardStat.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default AuthSlice.reducer;
export const { logout } = AuthSlice.actions;
