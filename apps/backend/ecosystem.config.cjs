module.exports = {
  apps: [
    {
      name: "ecgbc-backend",
      script: "./dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 8080
      }
    }
  ]
};
