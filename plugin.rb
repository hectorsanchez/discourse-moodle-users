# name: discourse-moodle-users
# about: Plugin para importar usuarios de Moodle y agruparlos por país.
# version: 0.1
# authors: Héctor Sanchez

after_initialize do
  # Controlador simple sin Engine
  class ::MoodleUsersController < ::ApplicationController
    skip_before_action :verify_authenticity_token
    skip_before_action :check_xhr, only: [:users]
    
    def users
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
        url = "#{moodle_url}?wstoken=#{token}&wsfunction=#{wsfunction}&#{criteria}&#{format}"

        uri = URI(url)
        response = Net::HTTP.get(uri)
        data = JSON.parse(response)
        
        unless data['users']
          render json: { error: "No se pudieron obtener usuarios de Moodle", raw_response: data }, status: 500
          return
        end

        users = data['users']
        grouped = users.group_by { |u| u['country'] || "Sin país" }
        result = grouped.transform_values do |arr|
          arr.map { |u| { firstname: u['firstname'], lastname: u['lastname'], email: u['email'] } }
        end

        render json: { users_by_country: result, total_users: users.length }
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



