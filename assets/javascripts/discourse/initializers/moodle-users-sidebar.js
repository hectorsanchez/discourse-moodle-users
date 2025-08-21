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

  // Agregar estilos CSS
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .moodle-users-interface {
      position: relative;
      z-index: 1000;
      background: white;
      min-height: 100vh;
      padding: 20px;
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
      border-bottom: 2px solid #e9e9e9;
    }

    .page-title {
      font-size: 2.5em;
      font-weight: 700;
      color: #333;
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
      font-weight: 700;
      color: #0084ff;
    }

    .stat-label {
      font-size: 0.9em;
      color: #666;
      margin-top: 5px;
    }

    .stat-time {
      font-size: 0.9em;
      color: #666;
      margin-left: 5px;
    }

    .filters-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
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
      color: #333;
      font-size: 0.9em;
    }

    .filter-select,
    .filter-input {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      min-width: 200px;
    }

    .filter-select:focus,
    .filter-input:focus {
      outline: none;
      border-color: #0084ff;
      box-shadow: 0 0 0 2px rgba(0, 132, 255, 0.2);
    }

    .users-content {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .country-section {
      background: white;
      border: 1px solid #e9e9e9;
      border-radius: 8px;
      overflow: hidden;
    }

    .country-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9e9e9;
    }

    .country-name {
      font-size: 1.3em;
      font-weight: 600;
      color: #333;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .country-count {
      background: #0084ff;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: 600;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      padding: 20px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      border: 1px solid #e9e9e9;
      border-radius: 6px;
      background: #fafafa;
      transition: all 0.2s ease;
    }

    .user-card:hover {
      background: white;
      border-color: #0084ff;
      box-shadow: 0 2px 8px rgba(0, 132, 255, 0.1);
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
      color: #333;
      margin-bottom: 5px;
      font-size: 1.1em;
    }

    .user-email {
      color: #666;
      font-size: 0.9em;
      word-break: break-all;
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-results-icon {
      font-size: 4em;
      margin-bottom: 20px;
    }

    .no-results h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .no-results p {
      margin: 0;
      font-size: 1.1em;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #0084ff;
      color: white;
    }

    .btn-primary:hover {
      background: #0066cc;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
      color: #666;
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
      color: #d33;
    }

    .error-icon {
      font-size: 4em;
      margin-bottom: 20px;
    }

    .error-message h3 {
      margin: 0 0 10px 0;
      color: #d33;
    }

    .error-message p {
      margin: 0;
      font-size: 1.1em;
    }

    .avatar-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #0084ff;
      color: white;
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

  // Insertar después del main content
  const mainContent = document.querySelector('.main-content') || document.querySelector('body');
  if (mainContent) {
    mainContent.appendChild(moodleInterface);
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
