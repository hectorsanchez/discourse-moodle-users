import Controller from "@ember/controller";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { service } from "@ember/service";

export default class MoodleUsersController extends Controller {
  @service ajax;
  
  @tracked users = {};
  @tracked countries = [];
  @tracked selectedCountry = null;
  @tracked searchTerm = "";
  @tracked loading = true;
  @tracked error = null;
  @tracked totalUsers = 0;
  @tracked lastUpdate = null;

  constructor() {
    super(...arguments);
    this.loadUsers();
  }

  @action
  async loadUsers() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await this.ajax.request('/moodle/users');
      
      if (response.success) {
        this.users = response.users_by_country;
        this.countries = Object.keys(this.users).sort();
        this.totalUsers = response.total_users;
        this.lastUpdate = response.timestamp;
        this.selectedCountry = null;
        this.searchTerm = "";
      } else {
        this.error = response.error || 'Error al cargar usuarios';
      }
    } catch (error) {
      this.error = 'Error de conexión: ' + error.message;
    } finally {
      this.loading = false;
    }
  }

  @action
  selectCountry(country) {
    this.selectedCountry = country === "all" ? null : country;
  }

  @action
  updateSearchTerm(event) {
    this.searchTerm = event.target.value;
  }

  @action
  clearFilters() {
    this.selectedCountry = null;
    this.searchTerm = "";
  }

  get filteredUsers() {
    let result = this.users;
    
    // Filtrar por país
    if (this.selectedCountry) {
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

  get totalFilteredUsers() {
    return Object.values(this.filteredUsers).reduce((total, users) => total + users.length, 0);
  }

  get totalCountries() {
    return this.countries.length;
  }
}
