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
    `avatar-${uuidv4()}${path.extname(originalname).toLowerCase()}`,
  REPORT: (originalname: string) =>
    `report-${uuidv4()}${path.extname(originalname).toLowerCase()}`,
  FILE: (originalname: string) =>
    `file-${uuidv4()}${path.extname(originalname).toLowerCase()}`,
  ORIGINAL: (originalname: string) => {
    const ext = path.extname(originalname).toLowerCase();
    // Sanitize base name to eliminate directory traversal or harmful characters
    const safeBaseName = path.basename(originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    return `${safeBaseName.slice(0, 50)}-${uuidv4()}${ext}`;
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
    MESSAGE: "Only .pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg format allowed!",
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
      cb(
        null,
        useOriginalname
          ? FILENAME["ORIGINAL"](file.originalname)
          : FILENAME[resource](file.originalname)
      );
    },
  });

  /**
   * Multer file upload with filters and size limits
   */
  const upload = multer({
    storage,
    limits: {
      fileSize: 1024 * 1024 * 20, // 20 MB
      fieldSize: 1024 * 1024 * 20, // 20 MB
    },
    fileFilter: function (req, file, cb) {
      // Validate MIME type
      if (!filter.CONTENT.includes(file.mimetype)) {
        cb(null, false);
        return cb(new AppError(filter.MESSAGE, 400));
      }

      // Validate file extension against dangerous executables
      const ext = path.extname(file.originalname).toLowerCase();
      const dangerousExtensions = [
        ".exe", ".bat", ".cmd", ".sh", ".php", ".js", ".html", ".htm",
        ".vbs", ".ps1", ".svg", ".dll", ".bin", ".phtml", ".phar"
      ];
      if (dangerousExtensions.includes(ext)) {
        cb(null, false);
        return cb(new AppError("Upload rejected: File extension not permitted for security reasons.", 400));
      }

      cb(null, true);
    },
  });
  return upload;
};
