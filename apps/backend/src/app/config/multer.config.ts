import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import AppError from "../shared/errors/app.error";

export const RESOURCES = {
  AVATAR: "AVATAR",
  REPORT: "REPORT",
  FILE: "FILE",
};

export const DESTINANTIONS = {
  IMAGE: {
    AVATAR: "../../../public/images/avatar",
  },
  FILE: {
    REPORT: "../../../public/files/report",
    FILE: "../../../public/files/file",
  },
};

export const FILENAME: {
  [key: string]: (originalname: string) => string;
} = {
  AVATAR: (originalname: string) =>
    `avatar-${uuidv4()}${path.extname(originalname)}`,
  REPORT: (originalname: string) =>
    `report-${uuidv4()}${path.extname(originalname)}`,
  FILE: (originalname: string) =>
    `file-${uuidv4()}${path.extname(originalname)}`,
  ORIGINAL: (originalname: string) => {
  const ext = originalname.substring(originalname.lastIndexOf('.'));
  const nameWithoutExt = originalname.substring(0, originalname.lastIndexOf('.'));
  return `${nameWithoutExt}-${uuidv4()}${ext}`;
},
};

export const FILTERS = {
  IMAGE: {
    CONTENT: ["image/png", "image/jpg", "image/jpeg"],
    MESSAGE: "Only .png, .jpg and .jpeg format allowed!",
  },
  REPORT: {
    CONTENT: ["application/pdf"],
    MESSAGE: "Only .pdf format allowed!",
  },
  FILE: {
    CONTENT: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ],
    MESSAGE: "Only .pdf, .doc, .xls, .png, .jpg, .jpeg format allowed!",
  },
};

export const multerConfig = (
  resource: string,
  destination: string,
  filter: any,
  useOriginalname: boolean = false
) => {
  /**
   * Multer disk storage
   */
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, destination));
    },
    filename: function (req, file, cb) {
      cb(null,useOriginalname ?FILENAME['ORIGINAL'](file.originalname): FILENAME[resource](file.originalname));
    },
  });

  /**
   * Multer file upload with filters
   */
  const upload = multer({
    storage,
    limits: {
      fileSize: 1024 * 1024 * 1024,
      fieldSize: 1024 * 1024 * 1024,
    },
    fileFilter: function (req, file, cb) {
      if (filter.CONTENT.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new AppError(filter.MESSAGE, 400));
      }
    },
  });
  return upload;
};
