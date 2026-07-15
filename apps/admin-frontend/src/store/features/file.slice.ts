import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { FileState } from "../../types/store/state.type";
import api from "../../api/axios";
import { FilesQuery } from "../../types/query/query-params.type";
import { NewFile, NewFiles } from "../../types/model/file.model";

const initialState: FileState = {
  files: [],
  filesFromSelamMinster: [],
  file: null,
  status: "idle",
  task: "",
  total: 1,
  page: 1,
  limit: 10,
};

export const fetchFiles = createAsyncThunk(
  "file/fetchFiles",
  async (
    { page = 1, limit = 10, member, fellowship }: FilesQuery,
    thunkAPI
  ) => {
    try {
      const queryParams: any = {
        _page: page,
        _limit: limit,
        isFromSelamMinster: 'false', 
      };
      if (member) queryParams.memberId = member;
      if (fellowship) queryParams.fellowshipId = fellowship;
      const response = await api.get(`/files`, { params: queryParams });
      const data = response.data.data;
      return { files: data.files };
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

export const fetchFilesFromSelamMinster = createAsyncThunk(
  "file/fetchFilesFromSelamMinster",
  async (
    { page = 1, limit = 10, member, fellowship }: FilesQuery,
    thunkAPI
  ) => {
    try {
      const queryParams: any = {
        _page: page,
        _limit: limit,
        isFromSelamMinster: 'true', // Add this line to include the new query param
      };
      if (member) queryParams.memberId = member;
      if (fellowship) queryParams.fellowshipId = fellowship;
      const response = await api.get(`/files`, { params: queryParams });
      const data = response.data.data;
      return { files: data.files };
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

export const fetchFile = createAsyncThunk(
  "file/fetchFile",
  async (id: string, thunkAPI) => {
    try {
      const response = await api.get(`/files/${id}`);
      const data = response.data.data;
      return { file: data.file };
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

export const createMemberFile = createAsyncThunk(
  "file/createMemberFile",
  async (
    {
      newFile,
      handleModalClose,
      resetForm,
    }: {
      newFile: NewFile;
      handleModalClose: () => void;
      resetForm: () => void;
    },
    thunkAPI
  ) => {
    try {
      const { memberId, file, fileName } = newFile;
      const formData = new FormData();
      if (memberId) formData.append("member", memberId);
      if (file instanceof File) formData.append("file", file);
      if (fileName) formData.append("fileName", fileName);
      const res = await api.post(`/files/member`, formData);
      handleModalClose();
      resetForm();
      toast.success("File added successfully");
      const data = res.data.data;
      return {
        file: data.file,
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
export const createMemberFiles = createAsyncThunk(
  "file/createMemberFiles",
  async (
    {
      newFile,
      handleModalClose,
      resetForm,
      isFromSelamMinster = false
    }: {
      newFile: NewFiles;
      handleModalClose: () => void;
      resetForm: () => void;
      isFromSelamMinster?:boolean
    },
    thunkAPI
  ) => {
    try {
      const { memberId, files } = newFile; // Destructure 'files' (plural)
      const formData = new FormData();
      if (memberId) formData.append("member", memberId);

      // Append each file to the formData
      // The backend should be ready to receive multiple files under the 'files' key
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("memberFiles", file); // Use 'files' as the key for the array
        });
      }
      if(isFromSelamMinster){
        formData.append("isFromSelamMinster",'true')
      }
      // 'fileName' is removed as we are sending raw files

      const res = await api.post(`/files/member/bulk-upload`, formData); // Potentially new endpoint for bulk
      handleModalClose();
      resetForm();
      toast.success(`${files.length} file(s) added successfully`);
      const data = res.data.data;
      // The backend might return an array of created file records
      return {
        isFromSelamMinster,
        files: data.files, // Assuming backend returns an array of created file objects
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

export const createFellowshipFiles = createAsyncThunk(
  "file/createFellowshipFiles",
  async (
    {
      files,
      councilFellowshipId,
    }: {
      files: File[];
      councilFellowshipId: string;
    },
    thunkAPI
  ) => {
    try {
      const formData = new FormData();
      if (councilFellowshipId) formData.append("fellowship", councilFellowshipId);

      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("fellowshipFiles", file);
        });
      }

      const res = await api.post(`/files/fellowship/bulk-upload`, formData);
      toast.success(`${files.length} file(s) added successfully`);
      const data = res.data.data;
      return {
        files: data.files,
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
export const deleteFile = createAsyncThunk(
  "file/deleteFile",
  async (
    {
      id,
      handleModalClose,
    }: {
      id: string;
      handleModalClose?: () => void;
    },
    thunkAPI
  ) => {
    try {
      await api.delete(`/files/${id}`);
      if(handleModalClose) handleModalClose();
      toast.success("File deleted successfully");
      // const data = res.data.data;
      return {
        id,
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

export const FileSlice = createSlice({
  name: "file",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.files = action.payload.files;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchFiles.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-files";
      })
      .addCase(fetchFiles.rejected, (state) => {
        state.status = "failed";
      })
       .addCase(fetchFilesFromSelamMinster.fulfilled, (state, action) => {
        state.filesFromSelamMinster = action.payload.files;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchFilesFromSelamMinster.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-files-from-selam-minster";
      })
      .addCase(fetchFilesFromSelamMinster.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchFile.fulfilled, (state, action) => {
        state.file = action.payload.file;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchFile.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-files";
      })
      .addCase(fetchFile.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createMemberFile.pending, (state) => {
        state.status = "loading";
        state.task = "create-file";
      })
      .addCase(createMemberFile.fulfilled, (state, action) => {
        state.files.push(action.payload.file);
        state.status = "idle";
        state.task = "";
      })
      .addCase(createMemberFile.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createMemberFiles.pending, (state) => {
        state.status = "loading";
        state.task = "create-files";
      })
      .addCase(createMemberFiles.fulfilled, (state, action) => {
        // Assuming action.payload.files is an array of new file objects
        if (action.payload.files && Array.isArray(action.payload.files)) {
        if(action.payload.isFromSelamMinster){
          state.filesFromSelamMinster.push(...action.payload.files);
        }
        else {
          state.files.push(...action.payload.files);
        }

        } 
        state.status = "idle";
        state.task = "";
      })
      .addCase(createMemberFiles.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createFellowshipFiles.pending, (state) => {
        state.status = "loading";
        state.task = "create-fellowship-files";
      })
      .addCase(createFellowshipFiles.fulfilled, (state, action) => {
        if (action.payload.files && Array.isArray(action.payload.files)) {
          state.files.push(...action.payload.files);
        } 
        state.status = "idle";
        state.task = "";
      })
      .addCase(createFellowshipFiles.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(deleteFile.pending, (state) => {
        state.status = "loading";
        state.task = "delete-file";
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter(
          (file) => file.id !== action.payload.id
        );
        state.status = "idle";
        state.task = "";
      })
      .addCase(deleteFile.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default FileSlice.reducer;
export const {} = FileSlice.actions;
