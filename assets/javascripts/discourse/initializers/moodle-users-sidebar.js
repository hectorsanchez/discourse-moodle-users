import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "moodle-users-sidebar",
  initialize() {
    withPluginApi("0.8.31", api => {
      // Agregar enlace al sidebar usando la API correcta de Discourse
      api.addCommunitySectionLink({
        name: "moodle-users",
        route: "discovery.latest", // Ruta temporal, la interceptaremos
        title: "Ver usuarios de Moodle importados del campus",
        text: "Moodle Users",
        icon: "users"
      });

      // Interceptar el click en el enlace
      api.onPageChange(() => {
        const moodleLink = document.querySelector('a[data-link-name="moodle-users"]');
        if (moodleLink && !moodleLink.hasAttribute('data-intercepted')) {
          moodleLink.setAttribute('data-intercepted', 'true');
          moodleLink.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Navegar a /moodle/users programáticamente
            window.history.pushState({}, '', '/moodle/users');
            
            // Mostrar la interfaz de usuarios de Moodle
            showMoodleUsersInterface();
          });
        }
        
        // Detectar si estamos en /moodle/users
        if (window.location.pathname === "/moodle/users") {
          showMoodleUsersInterface();
        } else {
          // Si no estamos en /moodle/users, ocultar la interfaz
          hideMoodleUsersInterface();
        }
      });
    });
  }
};

function showMoodleUsersInterface() {
  // Verificar si ya existe la interfaz
  if (document.querySelector('.moodle-users-interface')) {
    return;
  }

  // Ocultar el contenido principal de Discourse
  const existingMainOutlet = document.querySelector('#main-outlet');
  if (existingMainOutlet) {
    existingMainOutlet.style.display = 'none';
  }

  // Crear la interfaz
  const moodleInterface = document.createElement('div');
  moodleInterface.className = 'moodle-users-interface';
  moodleInterface.innerHTML = `
    <div class="moodle-users-page">
      <!-- Header con estadísticas -->
      <div class="page-header">
        <div class="page-header-content">
          <h1 class="page-title">${I18n.t('js.moodle_users.page_title')}</h1>
          <div class="page-header-stats">
            <span class="stat-item">
              <span class="stat-number" id="totalUsers">-</span>
              <span class="stat-label">${I18n.t('js.moodle_users.users')}</span>
            </span>
            <span class="stat-item">
              <span class="stat-number" id="totalCountries">-</span>
              <span class="stat-label">${I18n.t('js.moodle_users.countries')}</span>
            </span>

          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="refreshButton">
            ${I18n.t('js.moodle_users.update_button')}
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">${I18n.t('js.moodle_users.filter_by_country')}</label>
            <select class="filter-select" id="countryFilter">
              <option value="all">${I18n.t('js.moodle_users.all_countries')}</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">${I18n.t('js.moodle_users.search_user')}</label>
            <input 
              type="text" 
              class="filter-input" 
              id="searchInput"
              placeholder="${I18n.t('js.moodle_users.search_placeholder')}"
            />
          </div>
          
          <div class="filter-group">
            <button class="btn btn-secondary" id="clearFiltersButton">
              ${I18n.t('js.moodle_users.clear_filters')}
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de usuarios -->
      <div class="users-content" id="usersContent">
        <div class="loading">
          <div class="loading-spinner">⏳</div>
          <p>${I18n.t('js.moodle_users.loading')}</p>
        </div>
      </div>
    </div>
  `;

  // Los estilos CSS ahora están en assets/stylesheets/moodle-users.scss

  // Insertar dentro del contenedor principal de contenido de Discourse
  const mainOutlet = document.querySelector('#main-outlet');
  if (mainOutlet) {
    // Limpiar solo el contenido del área principal, no el sidebar
    mainOutlet.innerHTML = '';
    // Insertar nuestra interfaz
    mainOutlet.appendChild(moodleInterface);
    // Mostrar el contenedor principal
    mainOutlet.style.display = 'block';
  } else {
    // Fallback si no encuentra el contenedor principal
    const mainContent = document.querySelector('.main-content') || document.querySelector('body');
    if (mainContent) {
      mainContent.appendChild(moodleInterface);
    }
  }

  // Agregar event listeners para evitar CSP violations
  addEventListeners();
  
  // Cargar usuarios automáticamente
  loadMoodleUsers();
}

function hideMoodleUsersInterface() {
  // Ocultar la interfaz de Moodle si existe
  const moodleInterface = document.querySelector('.moodle-users-interface');
  if (moodleInterface) {
    moodleInterface.remove();
  }
  
  // Mostrar el contenido principal de Discourse
  const mainOutlet = document.querySelector('#main-outlet');
  if (mainOutlet) {
    mainOutlet.style.display = 'block';
  }
}

// Variables globales para el estado
let allUsers = {};
let allCountries = [];

async function loadMoodleUsers() {
  try {
    const response = await fetch('/moodle/users');
    const data = await response.json();
    
    if (data.success) {
      allUsers = data.users_by_country;
      allCountries = Object.keys(allUsers).sort();
      
      updateStats(data);
      populateCountryFilter();
      displayUsers(allUsers);
    } else {
      showError(data.error || 'Error al cargar usuarios');
    }
  } catch (error) {
    showError('Error de conexión: ' + error.message);
  }
}

function updateStats(data) {
  const totalElement = document.getElementById('totalUsers');
  const countriesElement = document.getElementById('totalCountries');
  const updateElement = document.getElementById('lastUpdate');
  
  if (totalElement) totalElement.textContent = data.total_users;
  if (countriesElement) countriesElement.textContent = allCountries.length;
  if (updateElement) updateElement.textContent = new Date(data.timestamp).toLocaleString();
}

function populateCountryFilter() {
  const select = document.getElementById('countryFilter');
  if (!select) return;
  
  select.innerHTML = '<option value="all">Todos los países</option>';
  
  allCountries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country === 'Sin país' ? I18n.t('js.moodle_users.no_country_specified') : country;
    select.appendChild(option);
  });
}

function filterUsers() {
  const countryFilter = document.getElementById('countryFilter');
  const searchInput = document.getElementById('searchInput');
  
  if (!countryFilter || !searchInput) return;
  
  const selectedCountry = countryFilter.value;
  const searchTerm = searchInput.value.toLowerCase();
  
  let filteredUsers = {};
  
  Object.keys(allUsers).forEach(country => {
    if (selectedCountry === 'all' || country === selectedCountry) {
      const countryUsers = allUsers[country].filter(user => 
        user.firstname.toLowerCase().includes(searchTerm) ||
        user.lastname.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      );
      
      if (countryUsers.length > 0) {
        filteredUsers[country] = countryUsers;
      }
    }
  });
  
  displayUsers(filteredUsers);
}

function displayUsers(users) {
  const content = document.getElementById('usersContent');
  if (!content) return;
  
  if (Object.keys(users).length === 0) {
    content.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>${I18n.t('js.moodle_users.no_results_title')}</h3>
        <p>${I18n.t('js.moodle_users.no_results_message')}</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  Object.keys(users).forEach(country => {
    const countryUsers = users[country];
    const countryDisplay = country === 'Sin país' ? I18n.t('js.moodle_users.no_country_specified') : country;
    
    html += `
      <div class="country-section">
        <div class="country-header">
          <h3 class="country-name">${countryDisplay}</h3>
          <span class="country-count">${countryUsers.length} usuarios</span>
        </div>
        
        <div class="users-grid">
          ${countryUsers.map(user => `
            <div class="user-card">
              <div class="user-avatar">
                <div class="avatar-placeholder">${getInitials(user.firstname, user.lastname)}</div>
              </div>
              <div class="user-info">
                <div class="user-name">${user.firstname} ${user.lastname}</div>
                <div class="user-email">${user.email}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  content.innerHTML = html;
}

function getInitials(firstname, lastname) {
  const first = firstname ? firstname.charAt(0).toUpperCase() : '';
  const last = lastname ? lastname.charAt(0).toUpperCase() : '';
  return first + last || '?';
}

function clearFilters() {
  const countryFilter = document.getElementById('countryFilter');
  const searchInput = document.getElementById('searchInput');
  
  if (countryFilter) countryFilter.value = 'all';
  if (searchInput) searchInput.value = '';
  
  filterUsers();
}

function showError(message) {
  const content = document.getElementById('usersContent');
  if (!content) return;
  
  content.innerHTML = `
    <div class="error-message">
      <div class="error-icon">❌</div>
      <h3>${I18n.t('js.moodle_users.error_title')}</h3>
      <p>${message}</p>
    </div>
  `;
}

function addEventListeners() {
  // Botón de actualizar
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton) {
    refreshButton.addEventListener('click', loadMoodleUsers);
  }
  
  // Filtro de país
  const countryFilter = document.getElementById('countryFilter');
  if (countryFilter) {
    countryFilter.addEventListener('change', filterUsers);
  }
  
  // Campo de búsqueda
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', filterUsers);
  }
  
  // Botón de limpiar filtros
  const clearFiltersButton = document.getElementById('clearFiltersButton');
  if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', clearFilters);
  }
}
