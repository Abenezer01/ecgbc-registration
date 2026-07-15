import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AuthSlice } from "./features/auth.slice";
import { StaffSlice } from "./features/staff.slice";
import { DataLookupSlice } from "./features/data-lookup.slice";
import { RoleSlice } from "./features/role.slice";
import { FellowshipSlice } from "./features/fellowship.slice";
import { MemberSlice } from "./features/member.slice";
import { ReportSlice } from "./features/report.slice";
import { FileSlice } from "./features/file.slice";
export const store = configureStore({
  reducer: {
    auth: AuthSlice.reducer,
    lookup: DataLookupSlice.reducer,
    role: RoleSlice.reducer,
    staff: StaffSlice.reducer,
    fellowship: FellowshipSlice.reducer,
    member: MemberSlice.reducer,
    report: ReportSlice.reducer,
    file: FileSlice.reducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch: () => typeof store.dispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
