const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const outputFile = "./swagger.json";
const endpointsFiles = ["./routes/index.js"];

const config = {
  info: {
    title: "Bikayi API Documentation",
    description: "",
  },
  tags: [],
  host: "http://192.168.1.19:3000",
  schemes: ["http", "https"],
  components: {
    // securitySchemes: {
    //   bearerAuthAdmin: {
    //     type: "http",
    //     scheme: "Bearer",
    //   },
    //   bearerAuthUser: {
    //     type: "http",
    //     scheme: "Bearer",
    //   },
    // },
  },
  //   securityDefinitions: {
  //     bearerAuth:{
  //         type: "http",
  //         in: "header",       // can be "header", "query" or "cookie"
  //         scheme: "bearer",
  //         name: "authorization",  // name of the header, query parameter or cookie
  //         description: "any description..."
  //     }
  // },
};

swaggerAutogen(outputFile, endpointsFiles, config).then(() => {
  require("./server.js");
});
