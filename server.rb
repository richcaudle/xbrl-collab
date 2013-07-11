require 'rubygems'
require 'sinatra/base'
require 'yaml'
require 'pusher'
require 'json'

class Server < Sinatra::Base

	# set Pusher configuration
	set :public_folder, Proc.new { File.join(root, "public") }
	config = YAML.load_file('./config.yml')

	Pusher.app_id = config['pusher']['app_id']
	Pusher.key = config['pusher']['app_key']
	Pusher.secret = config['pusher']['app_secret']
	#Pusher.host = 'localhost'
	#Pusher.port = 8081


	# main view action
	get '/' do
		@app_key = config['pusher']['app_key']
		erb :index
	end


	# authentication action
	post '/auth' do
		content_type :json
		
		if params[:channel_name].include? "presence-"
			Pusher[params[:channel_name]].authenticate(params[:socket_id], {
			  user_id: params[:socket_id]
			}).to_json
		else
			Pusher[params[:channel_name]].authenticate(params[:socket_id]).to_json
		end
		
	end


	run! if app_file == $0

end