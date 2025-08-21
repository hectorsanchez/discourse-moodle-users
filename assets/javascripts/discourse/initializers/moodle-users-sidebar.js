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
  const mainOutlet = document.querySelector('#main-outlet');
  if (mainOutlet) {
    mainOutlet.style.display = 'none';
  }

  // Crear la interfaz
  const interface = document.createElement('div');
  interface.className = 'moodle-users-interface';
  interface.innerHTML = `
    <div class="moodle-users-page">
      <!-- Header con estadísticas -->
      <div class="page-header">
        <div class="page-header-content">
          <h1 class="page-title">👥 Usuarios de Moodle</h1>
          <div class="page-header-stats">
            <span class="stat-item">
              <span class="stat-number" id="totalUsers">-</span>
              <span class="stat-label">usuarios</span>
            </span>
            <span class="stat-item">
              <span class="stat-number" id="totalCountries">-</span>
              <span class="stat-label">países</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">Última actualización:</span>
              <span class="stat-time" id="lastUpdate">-</span>
            </span>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" onclick="loadMoodleUsers()">
            🔄 Actualizar
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filters-row">
          <div class="filter-group">
            <label class="filter-label">Filtrar por país:</label>
            <select class="filter-select" id="countryFilter" onchange="filterUsers()">
              <option value="all">Todos los países</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Buscar usuario:</label>
            <input 
              type="text" 
              class="filter-input" 
              id="searchInput"
              placeholder="Nombre, apellido o email..."
              oninput="filterUsers()"
            />
          </div>
          
          <div class="filter-group">
            <button class="btn btn-secondary" onclick="clearFilters()">
              🗑️ Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de usuarios -->
      <div class="users-content" id="usersContent">
        <div class="loading">
          <div class="loading-spinner">⏳</div>
          <p>Cargando usuarios de Moodle...</p>
        </div>
      </div>
    </div>
  `;

  // Insertar después del main content
  const mainContent = document.querySelector('.main-content') || document.querySelector('body');
  if (mainContent) {
    mainContent.appendChild(interface);
  }

  // Cargar usuarios automáticamente
  loadMoodleUsers();
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
    option.textContent = country === 'Sin país' ? '🌍 Sin país especificado' : country;
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
        <h3>No se encontraron usuarios</h3>
        <p>Intenta ajustar los filtros o busca con otros términos.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  Object.keys(users).forEach(country => {
    const countryUsers = users[country];
    const countryDisplay = country === 'Sin país' ? '🌍 Sin país especificado' : country;
    
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
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `;
}
