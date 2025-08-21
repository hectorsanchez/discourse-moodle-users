import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "moodle-users-sidebar-link",
  initialize() {
    withPluginApi("0.8.31", api => {
      // Agregar el link al sidebar
      api.decorateWidget("sidebar-section-links:main", helper => {
        const currentUser = api.getCurrentUser();
        if (!currentUser) return helper.h();
        
        // Solo mostrar si el plugin está habilitado
        const pluginEnabled = api.container.lookup("service:site-settings").dmu_enabled;
        if (!pluginEnabled) return helper.h();
        
        return helper.h("li.sidebar-section-link-wrapper", [
          helper.h("a.sidebar-section-link.sidebar-row", {
            href: "/moodle/users",
            className: "ember-view sidebar-section-link sidebar-row"
          }, [
            helper.h("span.sidebar-section-link-prefix", "👥"),
            helper.h("span.sidebar-section-link-text", "Moodle Users")
          ])
        ]);
      });
    });
  }
};
