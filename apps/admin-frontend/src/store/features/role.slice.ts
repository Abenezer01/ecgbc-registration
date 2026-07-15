import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { RoleState } from "../../types/store/state.type";
import api from "../../api/axios";
import { NewRole } from "../../types/model/role.model";
import { RoleQuery } from "../../types/query/query-params.type";

const initialState: RoleState = {
  roles: [],
  permissions: [],
  role: null,
  status: "idle",
  task: "",
  total: 1,
  page: 1,
  limit: 10,
};


export const fetchPermissions = createAsyncThunk(
    "role/fetchPermissions",
    async (_, thunkAPI) => {
      try {
       
        const response = await api.get(`/permission`);
        const data = response.data.data;
        return { permissions: data.permissions };
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
  
export const fetchRoles = createAsyncThunk(
  "role/fetchRoles",
  async ({ page = 1, limit = 10, state }: RoleQuery, thunkAPI) => {
    try {
      const queryParams: any = {
        _page: page,
        _limit: limit,
      };
      if (state) queryParams.state = state;
      const response = await api.get(`/role`);
      const data = response.data.data;
      return { roles: data.roles };
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

export const createRole = createAsyncThunk(
    "role/createRole",
    async ({ newRole,closeCreateRole }: {newRole:NewRole,closeCreateRole:() => void}, thunkAPI) => {
      try {
        
        const response = await api.post(`/role`,newRole);
        closeCreateRole();
        toast.success('Role created successfully')
        const data = response.data.data;
        return { role: data.role };
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



export const updateRole = createAsyncThunk(
  "role/updateRole",
  async (
    { id, updatedRole,closeEditRole }: { id: string; updatedRole: NewRole,closeEditRole:() => void },
    thunkAPI
  ) => {
   
    try {
        const response = await api.patch(`/role/${id}`,updatedRole);
        closeEditRole();
        toast.success('Role updated successfully')
        const data = response.data.data;
        return { role: data.role };
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

export const RoleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
    .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissions = action.payload.permissions;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchPermissions.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-permissions";
      })
      .addCase(fetchPermissions.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload.roles;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchRoles.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-roles";
      })
      .addCase(fetchRoles.rejected, (state) => {
        state.status = "failed";
      })
        .addCase(createRole.pending, (state) => {
        state.status = "loading";
        state.task = "create-role";
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload.role);
        state.status = "idle";
        state.task = "";
      })
      .addCase(createRole.rejected, (state) => {
        state.status = "failed";
        
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.roles = state.roles.map(role=>{
            if(role.id === action.payload.role.id){
                return action.payload.role
            }
            return role
        })
        state.status = "idle";
        state.task = "";
      })
      .addCase(updateRole.pending, (state) => {
        state.status = "loading";
        state.task = "update-role";
      })
      .addCase(updateRole.rejected, (state) => {
        state.status = "failed";
        
      });
  },
});

export default RoleSlice.reducer;
export const {} = RoleSlice.actions;
