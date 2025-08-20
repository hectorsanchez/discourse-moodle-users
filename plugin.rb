# name: discourse-moodle-users
# about: Plugin para importar usuarios de Moodle y agruparlos por país
# version: 0.1
# authors: Héctor Sanchez

# Plugin básico para consumir la API de Moodle y agrupar usuarios por país
# Plugin Name: discourse-moodle-users
# Plugin URL: https://github.com/hectorsanchez/discourse-moodle-users

enabled_site_setting :moodle_api_token
enabled_site_setting :moodle_api_url

after_initialize do
  module ::DiscourseMoodleUsers
    class MoodleController < ::ApplicationController
      def users
        unless SiteSetting.enabled
          render json: { error: I18n.t("discourse_moodle_users.disabled") }, status: 403
          return
        end

        token = SiteSetting.moodle_api_token
        moodle_url = SiteSetting.moodle_api_url

        if token.blank? || moodle_url.blank?
          render json: { error: I18n.t("discourse_moodle_users.invalid_config") }, status: 400
          return
        end

        wsfunction = 'core_user_get_users'
        criteria = 'criteria[0][key]=email&criteria[0][value]=%'
        format = 'moodlewsrestformat=json'
        url = "#{moodle_url}?wstoken=#{token}&wsfunction=#{wsfunction}&#{criteria}&#{format}"

        response = Net::HTTP.get(URI(url))
        users = JSON.parse(response)['users']

        grouped = users.group_by { |u| u['country'] || I18n.t("discourse_moodle_users.no_country") }
        result = grouped.transform_values do |arr|
          arr.map { |u| { firstname: u['firstname'], lastname: u['lastname'], email: u['email'] } }
        end

        render json: { users_by_country: result }
      end
    end
  end

  Discourse::Application.routes.append do
    get '/moodle/users' => 'discourse_moodle_users/moodle#users'
  end
end



