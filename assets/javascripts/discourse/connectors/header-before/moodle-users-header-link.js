import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "moodle-users-header-link",
  initialize() {
    withPluginApi("0.8.31", api => {
      // Agregar un enlace en el header para usuarios de Moodle
      api.decorateWidget("header-buttons:before", helper => {
        const currentUser = api.getCurrentUser();
        if (!currentUser) return helper.h();
        
        // Solo mostrar si el plugin está habilitado
        const pluginEnabled = api.container.lookup("service:site-settings").dmu_enabled;
        if (!pluginEnabled) return helper.h();
        
        return helper.h(
          "li.header-dropdown-toggle.moodle-users-link",
          helper.h(
            "a",
            { 
              href: "/moodle/users",
              title: "Ver usuarios de Moodle",
              className: "btn btn-primary"
            },
            "👥 Usuarios Moodle"
          )
        );
      });
    });
  }
};
