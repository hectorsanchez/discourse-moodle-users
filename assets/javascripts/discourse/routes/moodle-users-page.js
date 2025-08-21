import DiscourseRoute from "discourse/routes/discourse";
import { ajax } from "discourse/lib/ajax";

export default class MoodleUsersPageRoute extends DiscourseRoute {
  model() {
    return ajax("/moodle/users").then(response => {
      return {
        users: response.users_by_country,
        totalUsers: response.total_users,
        timestamp: response.timestamp
      };
    });
  }

  setupController(controller, model) {
    controller.setProperties({
      users: model.users,
      totalUsers: model.totalUsers,
      timestamp: model.timestamp,
      selectedCountry: null,
      filteredUsers: model.users
    });
  }
}
