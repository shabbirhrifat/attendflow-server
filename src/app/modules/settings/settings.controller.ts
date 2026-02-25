import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SettingsService } from "./settings.service";
import { StatusCodes } from "http-status-codes";

const getSettings = catchAsync(async (req: Request, res: Response) => {
    const { group } = req.query;
    const result = await SettingsService.getSettings(group as string);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Settings retrieved successfully",
        data: result
    });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
    const settings = req.body;
    const result = await SettingsService.updateSettingsBulk(settings);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        message: "Settings updated successfully",
        data: result
    });
});

export const SettingsController = {
    getSettings,
    updateSettings
};
