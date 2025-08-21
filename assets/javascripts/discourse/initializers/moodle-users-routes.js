import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "moodle-users-routes",
  initialize() {
    withPluginApi("0.8.31", api => {
      // Registrar la ruta personalizada usando la API correcta
      api.modifyClass("router:main", {
        buildRoutes() {
          const routes = this._super(...arguments);
          
          // Agregar la ruta de usuarios de Moodle
          routes.push({
            path: "/moodle/users",
            route: "moodle-users"
          });
          
          return routes;
        }
      });
    });
  }
};
