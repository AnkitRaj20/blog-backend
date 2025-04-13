import mongoose from "mongoose";
import chalk from "chalk";
import path, { dirname } from "path";
import fs from "fs"
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * ! Global error handler for Mongoose/MongoDB
 */
export const globalErrorHandler = (error, req, res, next) => {
  const errorDetails = `
  Timestamp: ${new Date().toISOString()}
  API ENDPOINT : ${req.originalUrl || req.path}
  Error Name: ${error.name || "Unknown Error"}
  Error Message: ${error.message || "No message provided"}
  Stack Trace: ${error.stack || "No stack trace available"}

  ========================================================
`;
  console.error(
    chalk.red(
      `Error ${error.stack ? `Stack --> ${error.stack} \n` : ``}${
        error.message ? `Message --> ${error.message}` : ``
      }`
    )
  );

  // Create or append to the error.log file
    const logFilePath = path.join(__dirname, "../../error.log");
  
    // Check if the error.log file exists
    fs.appendFile(logFilePath, errorDetails, (err) => {
      if (err) {
        console.error(chalk.red("Error logging to file:", err));
      } else {
        console.log(chalk.green("Error details logged to 'error.log'"));
      }
    });
  

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      status: false,
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  // Duplicate key error (e.g., unique email constraint)
  if (error.code === 11000) {
    return res.status(409).json({
      status: false,
      message: "Duplicate key error",
      errors: Object.keys(error.keyValue).map((field) => ({
        field,
        message: `${field} already exists.`,
      })),
    });
  }

  // CastError (e.g., invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      status: false,
      message: `Invalid ${error.path}: ${error.value}`,
    });
  }

  // Custom application-level error with statusCode (Updated from httpStatus)
  if (error.statusCode && error.message) {
    return res.status(error.statusCode).json({
      status: false,
      message: error.message,
      errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
    });
  }

  // Fallback for unhandled errors
  return res.status(500).json({
    status: false,
    message: "Internal Server Error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};


// ----------------------------------------------------------------------

// ! This is the Sequelize error handler code (Uncomment when using sequelize with mysql)

// import {
//     ValidationError,
//     UniqueConstraintError,
//     DatabaseError,
//     ConnectionError,
//     ForeignKeyConstraintError,
//   } from "sequelize";
//   import chalk from "chalk";
  
//   /****
//    ** Global error handler function that logs errors and handles different types of Sequelize errors.
//    **
//    ** @param {Error} error - The error object to be handled
//    ** @param {Object} req - The request object
//    ** @param {Object} res - The response object
//    ** @param {Function} next - The next middleware function
//    ** @return {Object} - The response object with appropriate error handling
//    **/
//   export const globalErrorHandler = (error, req, res, next) => {
//     console.error(
//       chalk.red(
//         `Error ${error.stack ? `Stack--> ${error.stack} \n` : ``}${
//           error.message ? `Message --> ${error.message}` : ``
//         }`
//       )
//     );
  
//     if (error instanceof ValidationError) {
//       return res.status(400).json({
//         status: false,
//         message: "Validation Error",
//         errors: error.errors.map((err) => ({
//           field: err.path,
//           message: err.message,
//         })),
//       });
//     }
  
//     // Handle foreign key errors
//     if (error instanceof ForeignKeyConstraintError) {
//       return res.status(400).json({
//         status: false,
//         message: "Foreign Key Constraint Error",
//         errors: {
//           fields: error.fields[0],
//           message: `${error.fields[0]} is invalid or doesn't exist`,
//         },
//       });
//     }
  
//     // Handle unique constraint errors
//     if (error instanceof UniqueConstraintError) {
//       return res.status(409).json({
//         status: false,
//         message: "Email already exists",
//         errors: error.errors.map((err) => ({
//           field: err.path,
//           message: err.message,
//         })),
//       });
//     }
  
//     // Handle other Sequelize errors
//     if (error instanceof DatabaseError) {
//       return res.status(500).json({
//         status: false,
//         message: "Database error occurred",
//         details: error.message,
//       });
//     }
  
//     // Handle connection errors
//     if (error instanceof ConnectionError) {
//       return res.status(503).json({
//         status: false,
//         message: "Database connection error",
//         details: error.message,
//       });
//     }
  
//     // Handle internal errors (Updated from httpStatus to statusCode)
//     if (error.statusCode && error.message) {
//       return res
//         .status(error.statusCode)
//         .json({ 
//           status: false, 
//           message: error.message,
//           errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
//         });
//     }
  
//     // ESLINT-disable-next-line no-lonely-if
//     if (typeof error === "string") next(error);
  
//     // Handle generic errors
//     return res.status(500).json({
//       status: false,
//       message: "Internal Server Error",
//       details: process.env.NODE_ENV === "development" ? error.message : undefined, // Expose details only in development
//     });
//   };