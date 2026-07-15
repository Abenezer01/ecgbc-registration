import { CommonObjectState } from "../enums/common-object-state.enum";
import { ReportStatus } from "../enums/report-status.enum";


  const objectStateColors: { [key in CommonObjectState]: string } = {
    [CommonObjectState.DRAFT]: "#B0BEC5", // Grey
    [CommonObjectState.ACTIVE]: "#00CC14", // Green
    [CommonObjectState.IN_ACTIVE]: "#FF7F7F", // Light Red
    [CommonObjectState.DELETED]: "#F44336", // Red
  };

  export const objectStatusColor = (state:string): string=>{
  
    const objectState = state as CommonObjectState;
    return objectStateColors[objectState] || "#000000"; 
  }


  const reportStateColors: { [key in ReportStatus]: string } = {
    [ReportStatus.REPORTED]: "#00CC14", // Green
    [ReportStatus.NOT_REPORTED]: "#FFA500", // Orange
  };

  export const reportStatusColor = (state:string): string=>{
  
    const reportState = state as ReportStatus;
    return reportStateColors[reportState] || "#000000"; 
  }
