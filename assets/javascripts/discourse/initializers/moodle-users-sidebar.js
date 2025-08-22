import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "moodle-users-sidebar",
  initialize() {
    withPluginApi("0.8.31", api => {
      // Agregar enlace al sidebar
      api.addCommunitySectionLink({
        name: "moodle-users",
        route: "discovery.latest",
        title: "Ver usuarios de Moodle importados del campus",
        text: "Moodle Users",
        icon: "users"
      });

      // Interceptar el click en el enlace del sidebar
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
          // Si no estamos en /moodle/users, asegurar que la interfaz esté oculta
          hideMoodleUsersInterface();
          
          // Verificar que el contenido principal esté visible
          setTimeout(() => {
            const mainOutlet = document.getElementById('main-outlet');
            if (mainOutlet && mainOutlet.style.display === 'none') {
              console.log('Forzando visibilidad del contenido principal');
              mainOutlet.style.display = 'block';
            }
          }, 100);
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
  const mainOutlet = document.getElementById('main-outlet');
  if (mainOutlet) {
    mainOutlet.style.display = 'none';
  }

  // Crear la interfaz con CSS inline
  const moodleInterface = document.createElement('div');
  moodleInterface.className = 'moodle-users-interface';
  
  moodleInterface.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <!-- Header con estadísticas -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--primary-low);">
        <div>
          <h1 style="font-size: 2em; font-weight: 600; margin: 0 0 15px 0; color: var(--primary);">👥 Usuarios de Moodle</h1>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <span style="display: flex; flex-direction: column; align-items: center; text-align: center;">
              <span id="totalUsers" style="font-size: 1.5em; font-weight: 600; color: var(--primary);">-</span>
              <span style="font-size: 0.9em; color: var(--primary-medium); margin-top: 5px;">usuarios</span>
            </span>
            <span style="display: flex; flex-direction: column; align-items: center; text-align: center;">
              <span id="totalCountries" style="font-size: 1.5em; font-weight: 600; color: var(--primary);">-</span>
              <span style="font-size: 0.9em; color: var(--primary-medium); margin-top: 5px;">países</span>
            </span>
          </div>
        </div>
        <div>
          <button id="refreshButton" style="background: var(--primary); color: var(--secondary); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            🔄 Actualizar
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div style="background: var(--highlight-low); padding: 20px; border-radius: 4px; margin-bottom: 30px;">
        <div style="display: flex; gap: 20px; align-items: end; flex-wrap: wrap;">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 600; font-size: 0.9em; color: var(--primary);">Filtrar por país:</label>
            <select id="countryFilter" style="padding: 8px 12px; border: 1px solid var(--primary-low); border-radius: 4px; font-size: 14px; min-width: 200px; background: var(--secondary); color: var(--primary);">
              <option value="all">Todos los países</option>
            </select>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 600; font-size: 0.9em; color: var(--primary);">Buscar usuario:</label>
            <input 
              type="text" 
              id="searchInput"
              placeholder="Nombre, apellido o email..."
              style="padding: 8px 12px; border: 1px solid var(--primary-low); border-radius: 4px; font-size: 14px; min-width: 200px; background: var(--secondary); color: var(--primary);"
            />
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="clearFiltersButton" style="background: var(--primary-medium); color: var(--secondary); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              🗑️ Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de usuarios -->
      <div id="usersContent" style="display: flex; flex-direction: column; gap: 20px;">
        <div style="text-align: center; padding: 60px 20px; color: var(--primary-medium);">
          <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
          <p>Cargando usuarios de Moodle...</p>
        </div>
      </div>
    </div>
  `;

  // Insertar en el contenedor principal
  const mainOutletWrapper = document.getElementById('main-outlet-wrapper');
  if (mainOutletWrapper) {
    mainOutletWrapper.appendChild(moodleInterface);
  }

  // Cargar usuarios
  loadMoodleUsers();

  // Agregar event listeners
  addEventListeners();
}

function hideMoodleUsersInterface() {
  try {
    // Ocultar la interfaz de Moodle si existe
    const moodleInterface = document.querySelector('.moodle-users-interface');
    if (moodleInterface && moodleInterface.parentNode) {
      moodleInterface.remove();
    }
    
    // Restaurar el contenido principal de Discourse
    const mainOutlet = document.getElementById('main-outlet');
    if (mainOutlet) {
      mainOutlet.style.display = 'block';
      // Forzar un refresh del contenido si es necesario
      if (mainOutlet.children.length === 0) {
        // Si el main-outlet está vacío, Discourse puede necesitar recargar
        window.location.reload();
      }
    }
  } catch (e) {
    console.warn('Error al ocultar interfaz de Moodle:', e);
    // En caso de error, asegurar que el contenido principal esté visible
    const mainOutlet = document.getElementById('main-outlet');
    if (mainOutlet) {
      mainOutlet.style.display = 'block';
    }
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
  
  if (totalElement) totalElement.textContent = data.total_users;
  if (countriesElement) countriesElement.textContent = allCountries.length;
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
      <div style="text-align: center; padding: 60px 20px; color: var(--primary-medium);">
        <div style="font-size: 4em; margin-bottom: 20px;">🔍</div>
        <h3 style="margin: 0 0 10px 0; color: var(--primary);">No se encontraron usuarios</h3>
        <p style="margin: 0; font-size: 1.1em;">Intenta ajustar los filtros o busca con otros términos.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  Object.keys(users).forEach(country => {
    const countryUsers = users[country];
    const countryDisplay = country === 'Sin país' ? '🌍 Sin país especificado' : country;
    
    html += `
      <div style="background: var(--secondary); border: 1px solid var(--primary-low); border-radius: 4px; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: var(--highlight-low); border-bottom: 1px solid var(--primary-low);">
          <h3 style="font-size: 1.2em; font-weight: 600; margin: 0; color: var(--primary);">${countryDisplay}</h3>
          <span style="background: var(--primary); color: var(--secondary); padding: 4px 10px; border-radius: 12px; font-size: 0.9em; font-weight: 600;">${countryUsers.length} usuarios</span>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px; padding: 20px;">
          ${countryUsers.map(user => `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: var(--secondary); border: 1px solid var(--primary-low); border-radius: 4px;">
              <div style="flex-shrink: 0;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary); color: var(--secondary); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.2em;">
                  ${getInitials(user.firstname, user.lastname)}
                </div>
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; margin-bottom: 5px; font-size: 1.1em; color: var(--primary);">${user.firstname} ${user.lastname}</div>
                <div style="color: var(--primary-medium); font-size: 0.9em; word-break: break-all;">${user.email}</div>
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
    <div style="text-align: center; padding: 60px 20px; color: var(--danger);">
      <div style="font-size: 4em; margin-bottom: 20px;">❌</div>
      <h3 style="margin: 0 0 10px 0; color: var(--danger);">Error</h3>
      <p style="margin: 0; font-size: 1.1em;">${message}</p>
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
