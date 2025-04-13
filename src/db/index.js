import chalk from "chalk";
import mongoose from "mongoose"

export const connectDb = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}`);
        console.log(chalk.green(`\n Mongo DB connected successfully! DB HOST : ${connectionInstance.connection.host}`))
    } catch (error) {
        console.log(chalk.red("Error connecting Database", JSON.stringify(error)))
        process.exit(1)
    }
}