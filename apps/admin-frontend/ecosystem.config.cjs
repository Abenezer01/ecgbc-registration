module.exports = {
  apps: [
    {
      name: "frontend",
      script: "C:\\Windows\\System32\\cmd.exe",
      args: "/c npm run serve",
      interpreter: "none",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};