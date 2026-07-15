import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { ReportState } from "../../types/store/state.type";
import api from "../../api/axios";
import { NewReport, UpdatedReport } from "../../types/model/report.model";
import { ReportsQuery } from "../../types/query/query-params.type";

const initialState: ReportState = {
  reports: [],
  report: null,
  status: "idle",
  task: "",
  total: 1,
  page: 1,
  limit: 10,
};

export const fetchReports = createAsyncThunk(
  "report/fetchReports",
  async (
    { page = 1, limit = 10, status, member, fellowship }: ReportsQuery,
    thunkAPI
  ) => {
    try {
      const queryParams: any = {
        _page: page,
        _limit: limit,
      };
      if (status) queryParams.status = status;
      if (member) queryParams.memberId = member;
      if (fellowship) queryParams.fellowshipId = fellowship;
      const response = await api.get(`/reports`, { params: queryParams });
      const data = response.data.data;
      return { reports: data.reports };
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

export const fetchReport = createAsyncThunk(
  "report/fetchReport",
  async (id: string, thunkAPI) => {
    try {
      const response = await api.get(`/reports/${id}`);
      const data = response.data.data;
      return { report: data.report };
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

export const createMemberReport = createAsyncThunk(
  "report/createMemberReport",
  async (
    {
      newReport,
      handleModalClose,
      resetForm,
    }: {
      newReport: NewReport;
      handleModalClose: () => void;
      resetForm: () => void;
    },
    thunkAPI
  ) => {
    try {
      const { memberId, crv, reportedAt, remark, report ,year} = newReport;
      console.log("newReport data:", { memberId, crv, reportedAt, remark, report, year });
      // Validate memberId is a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!memberId || !uuidRegex.test(memberId)) {
        console.error("Invalid memberId format:", memberId);
        throw new Error("Invalid member ID format");
      }
      const formData = new FormData();
      const reportDate = reportedAt || new Date();
      const dateYear = reportDate.getFullYear();
      const month = String(reportDate.getMonth() + 1).padStart(2, '0');
      const day = String(reportDate.getDate()).padStart(2, '0');
      const formattedDate = `${dateYear}-${month}-${day}T00:00:00Z`;
      formData.append("reportedAt", formattedDate);
      if (memberId) formData.append("member", memberId);
      if (report) formData.append("report", report);
      if (crv) formData.append("crv", crv);
      formData.append("year", year.toString());
      if (remark) formData.append("remark", remark);
      console.log("Sending form data:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      console.log("About to send request to backend...");
      const res = await api.post(`/reports/member`, formData);
      handleModalClose();
      resetForm();
      toast.success(res.data.message || "Report saved successfully");
      const data = res.data.data;
      return {
        report: data.report,
      };
    } catch (error) {
      console.error("Full error response:", error);
      if (isAxiosError(error)) {
        console.error("Response data:", JSON.stringify(error.response?.data, null, 2));
        console.error("Response status:", error.response?.status);
        console.error("Response statusText:", error.response?.statusText);
      }
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
export const updateMemberReport = createAsyncThunk(
  "report/updateMemberReport",
  async (
    {
      updatedReport,
    }: {
      
      updatedReport: UpdatedReport;
    },
    thunkAPI
  ) => {
    try {
      const { reportId, crv, reportedAt, remark, report } = updatedReport;
      const formData = new FormData();
      //@ts-ignore
      const reportDate = reportedAt || new Date();
      const dateYear = reportDate.getFullYear();
      const month = String(reportDate.getMonth() + 1).padStart(2, '0');
      const day = String(reportDate.getDate()).padStart(2, '0');
      const formattedDate = `${dateYear}-${month}-${day}T00:00:00Z`;
      formData.append("reportedAt", formattedDate);
      if (reportId) formData.append("reportId", reportId);
      if (report) formData.append("report", report);
      if (crv) formData.append("crv", crv);
      if (remark) formData.append("remark", remark);
      const res = await api.patch(`/reports/member`, formData);
      toast.success("Report updated successfully");
      const data = res.data.data;
      return {
        report: data.report,
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
export const deleteMemberReport = createAsyncThunk(
  "report/deleteMemberReport",
  async (
    reportId: string,
    thunkAPI
  ) => {
    try {
     
      await api.delete(`/reports/member/${reportId}`);
      toast.success("Report deleted successfully");
     
      return {
        reportId
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
export const createFellowshipReport = createAsyncThunk(
  "report/createFellowshipReport",
  async (
    {
      newReport,
      handleModalClose,
      resetForm,
    }: {
      newReport: NewReport;
      handleModalClose: () => void;
      resetForm: () => void;
    },
    thunkAPI
  ) => {
    try {
      const { councilFellowshipId, crv, reportedAt, remark, report ,year} = newReport;
      const formData = new FormData();
      if (reportedAt){
        const year = reportedAt.getFullYear();
      const month = (reportedAt.getMonth() + 1).toString().padStart(2, '0');
      const day = reportedAt.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      formData.append("reportedAt", formattedDate);
      }
      if (councilFellowshipId) formData.append("fellowship", councilFellowshipId);
      if (report) formData.append("report", report);
      if (crv) formData.append("crv", crv);
      if (year) formData.append("year", year.toString());
      if (remark) formData.append("remark", remark);
      const res = await api.post(`/reports/fellowship`, formData);
      handleModalClose();
      resetForm();
      toast.success("Report added successfully");
      const data = res.data.data;
      return {
        report: data.report,
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
export const updateFellowshipReport = createAsyncThunk(
  "report/updateFellowshipReport",
  async (
    {
      updatedReport,
    }: {
      
      updatedReport: UpdatedReport;
    },
    thunkAPI
  ) => {
    try {
      const { reportId, crv, reportedAt, remark, report } = updatedReport;
      const formData = new FormData();
      //@ts-ignore
      if (reportedAt){
        const year = reportedAt.getFullYear();
      const month = (reportedAt.getMonth() + 1).toString().padStart(2, '0');
      const day = reportedAt.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      formData.append("reportedAt", formattedDate);
      }
      if (reportId) formData.append("reportId", reportId);
      if (report) formData.append("report", report);
      if (crv) formData.append("crv", crv);
      if (remark) formData.append("remark", remark);
      const res = await api.patch(`/reports/fellowship`, formData);
      toast.success("Report updated successfully");
      const data = res.data.data;
      return {
        report: data.report,
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
export const deleteFellowshipReport = createAsyncThunk(
  "report/deleteFellowshipReport",
  async (
    reportId: string,
    thunkAPI
  ) => {
    try {
     
      await api.delete(`/reports/fellowship/${reportId}`);
      toast.success("Report deleted successfully");
     
      return {
        reportId
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
export const ReportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.reports = action.payload.reports;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchReports.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-reports";
      })
      .addCase(fetchReports.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.report = action.payload.report;
        state.task = "";
        state.status = "idle";
      })
      .addCase(fetchReport.pending, (state) => {
        state.status = "loading";
        state.task = "fetch-reports";
      })
      .addCase(fetchReport.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createMemberReport.pending, (state) => {
        state.status = "loading";
        state.task = "create-report";
      })
      .addCase(createMemberReport.fulfilled, (state, action) => {
        state.reports.push(action.payload.report);
        state.status = "idle";
        state.task = "";
      })
      .addCase(createMemberReport.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(updateMemberReport.pending, (state) => {
        state.status = "loading";
        state.task = "update-report";
      })
      .addCase(updateMemberReport.fulfilled, (state, action) => {
        state.reports = state.reports.map((report) => {
          if (report.id === action.payload.report.id) {
            return action.payload.report;
          }
          return report;
        });
        state.status = "idle";
        state.task = "";
      })
      .addCase(updateMemberReport.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(deleteMemberReport.pending, (state) => {
        state.status = "loading";
        state.task = "delete-report";
      })
      .addCase(deleteMemberReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter(
          (report) => report.id !== action.payload.reportId
        );
        state.status = "idle";
        state.task = "";
      })
      .addCase(deleteMemberReport.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(createFellowshipReport.pending, (state) => {
        state.status = "loading";
        state.task = "create-report";
      })
      .addCase(createFellowshipReport.fulfilled, (state, action) => {
        state.reports.push(action.payload.report);
        state.status = "idle";
        state.task = "";
      })
      .addCase(createFellowshipReport.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(updateFellowshipReport.pending, (state) => {
        state.status = "loading";
        state.task = "update-report";
      })
      .addCase(updateFellowshipReport.fulfilled, (state, action) => {
        state.reports = state.reports.map((report) => {
          if (report.id === action.payload.report.id) {
            return action.payload.report;
          }
          return report;
        });
        state.status = "idle";
        state.task = "";
      })
      .addCase(updateFellowshipReport.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(deleteFellowshipReport.pending, (state) => {
        state.status = "loading";
        state.task = "delete-report";
      })
      .addCase(deleteFellowshipReport.fulfilled, (state, action) => {
        state.reports = state.reports.filter(
          (report) => report.id !== action.payload.reportId
        );
        state.status = "idle";
        state.task = "";
      })
      .addCase(deleteFellowshipReport.rejected, (state) => {
        state.status = "failed";
      })
      ;
  },
});

export default ReportSlice.reducer;
export const {} = ReportSlice.actions;
