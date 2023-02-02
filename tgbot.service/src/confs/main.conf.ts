import { registerAs } from "@nestjs/config";

export enum ProjectState {
  DEV,
  TEST_PROD,
  PROD,
}

export default registerAs('main', () => {

  const envIsDev = process.env.PROJECT_STATE;
  let isDev = ProjectState.DEV
  if (envIsDev == "1")
    isDev = ProjectState.TEST_PROD
  else if (envIsDev == "2")
    isDev = ProjectState.PROD

  return {
    isDev,
    jwtSecret: process.env.JWT_SECRET,
    emailCodeMax: 999999,
    emailCodeMin: 111111,
    port: parseInt(process.env.MAIN_PORT),
    microservicePort: parseInt(process.env.MAIN_MICROSERVICE_PORT),
    tgMicroservicePort: parseInt(process.env.TG_MICROSERVICE_PORT),
    distributionMicroservicePort: parseInt(process.env.DISTRIBUTION_MICROSERVICE_PORT)
  }
});