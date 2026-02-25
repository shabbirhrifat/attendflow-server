import path from "path"
import fs from "fs"

// Define the absolute path to the folder where the images are stored
const uploadDirectory = path.join(__dirname, '../../../public');

// Helper function to safely delete an image
const deleteFile = (filePath: string) => {
  const fullFilePath = path.join(uploadDirectory, filePath);

  // Check if the file exists before attempting to delete
  if (fs.existsSync(fullFilePath)) {
    try {
      fs.unlinkSync(fullFilePath);
    } catch (_err) {
      // File deletion failed silently — non-critical operation
    }
  }
};
export default deleteFile;
