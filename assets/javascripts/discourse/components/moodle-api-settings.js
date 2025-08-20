import Component from "@ember/component";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import { set } from "@ember/object";

export default Component.extend({
  dmu_moodle_api_token: "",
  dmu_moodle_api_url: "",

  didInsertElement() {
    // Puedes cargar los valores actuales desde SiteSetting si lo necesitas
  },

  @action
  saveSettings() {
    // Aquí deberías implementar la lógica para guardar los settings vía AJAX
    // Ejemplo de llamada a un endpoint personalizado
    ajax("/moodle/save_settings", {
      method: "POST",
      data: {
        dmu_moodle_api_token: this.dmu_moodle_api_token,
        dmu_moodle_api_url: this.dmu_moodle_api_url,
      },
    }).then(() => {
      // Mostrar mensaje de éxito
    });
  },
});