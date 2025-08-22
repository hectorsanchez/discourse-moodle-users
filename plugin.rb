# name: discourse-moodle-users
# about: Plugin para importar usuarios de Moodle y agruparlos por país.
# version: 0.1
# authors: Héctor Sanchez
# stylesheets: moodle-users

after_initialize do
  # Controlador simple sin Engine
  class ::MoodleUsersController < ::ApplicationController
    skip_before_action :verify_authenticity_token
    skip_before_action :check_xhr, only: [:users]
    skip_before_action :preload_json, only: [:users]
    skip_before_action :redirect_to_login_if_required, only: [:users]
    
    def users
      # Establecer headers para respuesta JSON
      response.headers['Content-Type'] = 'application/json'
      response.headers['Access-Control-Allow-Origin'] = '*'
      
      unless SiteSetting.dmu_enabled
        render json: { error: "El plugin de usuarios Moodle está deshabilitado." }, status: 403
        return
      end

      token = SiteSetting.dmu_moodle_api_token
      moodle_url = SiteSetting.dmu_moodle_api_url

      if token.blank? || moodle_url.blank?
        render json: { error: "Token de Moodle y URL no configurados correctamente." }, status: 400
        return
      end

      begin
        require 'net/http'
        require 'uri'
        require 'json'
        
        wsfunction = 'core_user_get_users'
        criteria = 'criteria[0][key]=email&criteria[0][value]=%'
        format = 'moodlewsrestformat=json'
        
        # Construir la URL de manera más segura
        uri = URI(moodle_url)
        uri.query = URI.encode_www_form({
          'wstoken' => token,
          'wsfunction' => wsfunction,
          'criteria[0][key]' => 'email',
          'criteria[0][value]' => '%',
          'moodlewsrestformat' => 'json'
        })
        url = uri.to_s

        # Usar la URL construida
        request_uri = URI(url)
        http = Net::HTTP.new(request_uri.host, request_uri.port)
        http.use_ssl = true if request_uri.scheme == 'https'
        http.read_timeout = 30
        
        request = Net::HTTP::Get.new(request_uri)
        response_http = http.request(request)
        
        unless response_http.code.to_i == 200
          render json: { error: "Error HTTP #{response_http.code} al conectar con Moodle" }, status: 500
          return
        end
        
        data = JSON.parse(response_http.body)
        
        if data['exception']
          render json: { error: "Error de Moodle: #{data['message']}" }, status: 500
          return
        end
        
        unless data['users']
          render json: { error: "No se pudieron obtener usuarios de Moodle", raw_response: data }, status: 500
          return
        end

        users = data['users']
        grouped = users.group_by { |u| u['country'] || "Sin país" }
        result = grouped.transform_values do |arr|
          arr.map { |u| { firstname: u['firstname'], lastname: u['lastname'], email: u['email'] } }
        end

        render json: { 
          success: true,
          users_by_country: result, 
          total_users: users.length,
          timestamp: Time.current.iso8601
        }
      rescue JSON::ParserError => e
        Rails.logger.error "Error parsing Moodle API response: #{e.message}"
        render json: { error: "Respuesta inválida de la API de Moodle" }, status: 500
      rescue => e
        Rails.logger.error "Error en Moodle API: #{e.message}"
        render json: { error: "Error al obtener usuarios: #{e.message}" }, status: 500
      end
    end

    def save_settings
      return render json: { error: "Unauthorized" }, status: 401 unless current_user&.admin?
      
      SiteSetting.dmu_moodle_api_token = params[:dmu_moodle_api_token]
      SiteSetting.dmu_moodle_api_url = params[:dmu_moodle_api_url]
      render json: { success: true }
    end
  end

  # Registrar las rutas directamente
  Discourse::Application.routes.append do
    get '/moodle/users' => 'moodle_users#users'
    post '/moodle/save_settings' => 'moodle_users#save_settings'
  end
end



