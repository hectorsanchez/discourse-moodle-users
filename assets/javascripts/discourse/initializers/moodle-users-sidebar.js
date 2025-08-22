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

  // Agregar estilos CSS simplificados y nativos de Discourse
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .moodle-users-interface {
      position: relative;
      z-index: 1000;
      width: 100%;
      box-sizing: border-box;
    }

    .moodle-users-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--primary-low);
    }

    .page-title {
      font-size: 2em;
      font-weight: 600;
      margin: 0 0 15px 0;
    }

    .page-header-stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat-number {
      font-size: 1.5em;
      font-weight: 600;
      color: var(--primary);
    }

    .stat-label {
      font-size: 0.9em;
      color: var(--primary-medium);
      margin-top: 5px;
    }

    .filters-section {
      background: var(--highlight-low);
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 30px;
    }

    .filters-row {
      display: flex;
      gap: 20px;
      align-items: end;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-label {
      font-weight: 600;
      font-size: 0.9em;
    }

    .filter-select,
    .filter-input {
      padding: 8px 12px;
      border: 1px solid var(--primary-low);
      border-radius: 4px;
      font-size: 14px;
      min-width: 200px;
    }

    .users-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .country-section {
      background: var(--secondary);
      border: 1px solid var(--primary-low);
      border-radius: 4px;
      overflow: hidden;
    }

    .country-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: var(--highlight-low);
      border-bottom: 1px solid var(--primary-low);
    }

    .country-name {
      font-size: 1.2em;
      font-weight: 600;
      margin: 0;
    }

    .country-count {
      background: var(--primary);
      color: var(--secondary);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.9em;
      font-weight: 600;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 10px;
      padding: 20px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: var(--secondary);
    }

    .user-avatar {
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-weight: 600;
      margin-bottom: 5px;
      font-size: 1.1em;
    }

    .user-email {
      color: var(--primary-medium);
      font-size: 0.9em;
      word-break: break-all;
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: var(--primary-medium);
    }

    .no-results-icon {
      font-size: 4em;
      margin-bottom: 20px;
    }

    .no-results h3 {
      margin: 0 0 10px 0;
    }

    .no-results p {
      margin: 0;
      font-size: 1.1em;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
      color: var(--primary-medium);
    }

    .loading-spinner {
      font-size: 3em;
      margin-bottom: 20px;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      text-align: center;
      padding: 60px 20px;
      color: var(--danger);
    }

    .error-icon {
      font-size: 4em;
      margin-bottom: 20px;
    }

    .error-message h3 {
      margin: 0 0 10px 0;
      color: var(--danger);
    }

    .error-message p {
      margin: 0;
      font-size: 1.1em;
    }

    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.2em;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 20px;
      }
      
      .filters-row {
        flex-direction: column;
        gap: 15px;
      }
      
      .filter-select,
      .filter-input {
        min-width: 100%;
      }
      
      .users-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  // Insertar estilos CSS en el head
  document.head.appendChild(styleElement);

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
