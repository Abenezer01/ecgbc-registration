// vite.config.ts
import { defineConfig, loadEnv } from "file:///C:/Users/HP/Desktop/Projects/nicomas/ecgbc-admin-frontend/node_modules/.pnpm/vite@5.4.11_@types+node@22.10.1/node_modules/vite/dist/node/index.js";
import viteReact from "file:///C:/Users/HP/Desktop/Projects/nicomas/ecgbc-admin-frontend/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.11_@types+node@22.10.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { TanStackRouterVite } from "file:///C:/Users/HP/Desktop/Projects/nicomas/ecgbc-admin-frontend/node_modules/.pnpm/@tanstack+router-plugin@1.8_0617b0afb3e13d79e0e91a20eb18ebf4/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    define: {
      "process.env": env
    },
    plugins: [
      viteReact(),
      TanStackRouterVite({
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts"
      })
      // ...,
    ]
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEZXNrdG9wXFxcXFByb2plY3RzXFxcXG5pY29tYXNcXFxcZWNnYmMtYWRtaW4tZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhQXFxcXERlc2t0b3BcXFxcUHJvamVjdHNcXFxcbmljb21hc1xcXFxlY2diYy1hZG1pbi1mcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSFAvRGVza3RvcC9Qcm9qZWN0cy9uaWNvbWFzL2VjZ2JjLWFkbWluLWZyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7Ly8gdml0ZS5jb25maWcudHNcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgdml0ZVJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyBUYW5TdGFja1JvdXRlclZpdGUgfSBmcm9tICdAdGFuc3RhY2svcm91dGVyLXBsdWdpbi92aXRlJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7bW9kZX0pPT57XHJcblxyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBkZWZpbmU6IHtcclxuICAgICAgXCJwcm9jZXNzLmVudlwiOiBlbnYsXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogW1xyXG4gICAgICB2aXRlUmVhY3QoKSxcclxuICAgICAgVGFuU3RhY2tSb3V0ZXJWaXRlKHtcclxuICAgICAgICByb3V0ZXNEaXJlY3Rvcnk6ICcuL3NyYy9yb3V0ZXMnLFxyXG4gICAgICAgIGdlbmVyYXRlZFJvdXRlVHJlZTogJy4vc3JjL3JvdXRlVHJlZS5nZW4udHMnLFxyXG4gICAgICB9KSxcclxuXHJcbiAgICAgIC8vIC4uLixcclxuICAgIF0sXHJcbiAgfVxyXG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGNBQWEsZUFBZTtBQUNyQyxPQUFPLGVBQWU7QUFDdEIsU0FBUywwQkFBMEI7QUFHbkMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBQyxLQUFJLE1BQUk7QUFFcEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRTNDLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLGVBQWU7QUFBQSxJQUNqQjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsVUFBVTtBQUFBLE1BQ1YsbUJBQW1CO0FBQUEsUUFDakIsaUJBQWlCO0FBQUEsUUFDakIsb0JBQW9CO0FBQUEsTUFDdEIsQ0FBQztBQUFBO0FBQUEsSUFHSDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=