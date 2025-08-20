import Component from "@ember/component";
import { ajax } from "discourse/lib/ajax";

export default Component.extend({
  dmu_moodle_api_token: "",
  dmu_moodle_api_url: "",

  actions: {
    saveSettings() {
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
  },
});