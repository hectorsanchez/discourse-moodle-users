# name: discourse-moodle-users
# about: Plugin para importar usuarios de Moodle y agruparlos por país. Configuración avanzada en /admin/plugins/moodle_api_settings
# version: 0.1
# authors: Héctor Sanchez

after_initialize do
  module ::DiscourseMoodleUsers
    PLUGIN_NAME ||= "discourse-moodle-users".freeze

    class Engine < ::Rails::Engine
      engine_name PLUGIN_NAME
      isolate_namespace DiscourseMoodleUsers
    end
  end

  # Controlador
  class ::DiscourseMoodleUsers::MoodleController < ::ApplicationController::Base
    skip_before_action :verify_authenticity_token
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

      wsfunction = 'core_user_get_users'
      criteria = 'criteria[0][key]=email&criteria[0][value]=%'
      format = 'moodlewsrestformat=json'
      url = "#{moodle_url}?wstoken=#{token}&wsfunction=#{wsfunction}&#{criteria}&#{format}"

      response = Net::HTTP.get(URI(url))
      users = JSON.parse(response)['users']

      grouped = users.group_by { |u| u['country'] || "Sin país" }
      result = grouped.transform_values do |arr|
        arr.map { |u| { firstname: u['firstname'], lastname: u['lastname'], email: u['email'] } }
      end

      render json: { users_by_country: result }
    end

    def save_settings
      SiteSetting.dmu_moodle_api_token = params[:dmu_moodle_api_token]
      SiteSetting.dmu_moodle_api_url = params[:dmu_moodle_api_url]
      render json: { success: true }
    end
  end

  # Rutas dentro del Engine
  DiscourseMoodleUsers::Engine.routes.draw do
    get '/users' => 'moodle#users'
    post '/save_settings' => 'moodle#save_settings'
  end

  # Montar el Engine en la app principal
  Discourse::Application.routes.append do
    mount ::DiscourseMoodleUsers::Engine, at: '/moodle'
  end
end



