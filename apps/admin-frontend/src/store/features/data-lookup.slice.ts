import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {isAxiosError} from "axios";

import { toast } from "sonner";
import api from "../../api/axios";
import { DataLookupState } from "../../types/store/state.type";
import { DataLookupQuery } from "../../types/query/query-params.type";


const initialState: DataLookupState = {
    dataLookUps:[],
    activeStatus:null,
  status: 'idle',
  task:'',
  orderStatuses:[]
};



 export const fetchDataLookups = createAsyncThunk(
   "dataLookup/fetchDataLookups",
   async ({ category }: DataLookupQuery,thunkAPI) => {
     try {
        let queryParams:any ={};
        if(category) queryParams.category = category
       const response = await api.get(`/data-lookups`);
       return {
         lookups: response.data.data.lookups,
       };
     } catch (error: any) {
        let errors: any = [];
        if (isAxiosError(error)) {
            console.log('checking error data')
            console.log(error)
          errors = error.response?.data.errors
          if (errors) {
            errors.forEach((err: any) => {
              toast.error(err?.msg)
              // store.dispatch(setAlert({ alertType: 'error', msg: err?.msg }))
            })
          }
        } else {
          errors = error && error.toString()
        }
        console.error(errors)
        return thunkAPI.rejectWithValue(errors)
     }
   }
 );
 export const fetchActiveStatus = createAsyncThunk(
  "dataLookup/fetchActiveStatus",
  async (_data,thunkAPI) => {
    try {
      const response = await api.get(`/data-lookups?value=object_state_active`);
      return {
        lookup: response.data.data.lookups[0],
      };
    } catch (error: any) {
       let errors: any = [];
       if (isAxiosError(error)) {
           console.log('checking error data')
           console.log(error)
         errors = error.response?.data.errors
         if (errors) {
           errors.forEach((err: any) => {
             toast.error(err?.msg)
             // store.dispatch(setAlert({ alertType: 'error', msg: err?.msg }))
           })
         }
       } else {
         errors = error && error.toString()
       }
       console.error(errors)
       return thunkAPI.rejectWithValue(errors)
    }
  }
);
export const DataLookupSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchDataLookups.pending, (state) => {
        state.status = 'loading'
        state.task='fetch-data-lookups'
      })
    .addCase(fetchDataLookups.fulfilled, (state, action) => {
      state.dataLookUps = action.payload.lookups;
      state.status = 'idle'
      state.task=''
    }).addCase(fetchDataLookups.rejected, (state) => {
      state.status = 'failed';
      state.task=''
    }).addCase(fetchActiveStatus.pending, (state) => {
      state.status = 'loading'
      state.task='fetch-data-lookups'
    })
  .addCase(fetchActiveStatus.fulfilled, (state, action) => {
    state.activeStatus = action.payload.lookup;
    state.status = 'idle'
    state.task=''
  }).addCase(fetchActiveStatus.rejected, (state) => {
    state.status = 'failed';
    state.task=''
  })

       
      
  },
});

export default DataLookupSlice.reducer;
