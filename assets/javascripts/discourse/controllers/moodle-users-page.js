import Controller from "@ember/controller";
import { action, computed } from "@ember/object";
import { tracked } from "@glimmer/tracking";

export default class MoodleUsersPageController extends Controller {
  @tracked selectedCountry = null;
  @tracked searchTerm = "";

  @computed("users", "selectedCountry", "searchTerm")
  get filteredUsers() {
    let result = this.users;
    
    // Filtrar por país
    if (this.selectedCountry && this.selectedCountry !== "all") {
      result = { [this.selectedCountry]: this.users[this.selectedCountry] };
    }
    
    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const filtered = {};
      Object.keys(result).forEach(country => {
        const countryUsers = result[country].filter(user => 
          user.firstname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          user.lastname.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
        if (countryUsers.length > 0) {
          filtered[country] = countryUsers;
        }
      });
      result = filtered;
    }
    
    return result;
  }

  @computed("users")
  get countries() {
    return Object.keys(this.users).sort();
  }

  @computed("filteredUsers")
  get totalFilteredUsers() {
    return Object.values(this.filteredUsers).reduce((total, users) => total + users.length, 0);
  }

  @action
  selectCountry(country) {
    this.selectedCountry = country === "all" ? null : country;
  }

  @action
  clearFilters() {
    this.selectedCountry = null;
    this.searchTerm = "";
  }

  @action
  refreshUsers() {
    this.send("refreshModel");
  }
}
