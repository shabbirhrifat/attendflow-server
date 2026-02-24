import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ImportService } from "./import.service";
import { StatusCodes } from "http-status-codes";

const validateImport = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.body;
    const file = req.file as Express.Multer.File | undefined; // Type assertion for multer file

    if (!file) {
        return sendResponse(res, {
            statusCode: StatusCodes.BAD_REQUEST,
            message: "No file uploaded",
            data: null
        });
    }

    const result = await ImportService.validateFile(type, file);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "File validated successfully",
        data: result
    });
});

const executeImport = catchAsync(async (req: Request, res: Response) => {
    const result = await ImportService.executeImport(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Import executed successfully",
        data: result
    });
});

export const ImportController = {
    validateImport,
    executeImport
};
