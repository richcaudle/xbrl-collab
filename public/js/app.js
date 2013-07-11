var socketId = null;
var username = null;
var chComments = null;
var chPresence = null;
var isResolved = false;
var iAmAdmin = false;
  
$(function () {
	
	setupUI();
	initPusher();	
	updateStatus();
	
});

function initPusher()
{
	// --- FOR DEBUG ONLY -- //
	Pusher.log = function (message) {
	    if (window.console && window.console.log) {
	        window.console.log(message);
	    }
	};

	Pusher.Network = new Pusher.EventsDispatcher();
	Pusher.Network.isOnline = function() { return true; }

	// --- CONNECT TO PUSHER -- //
    var pusher = new Pusher(PUSHER_CONFIG.APP_KEY, {
        wsHost: "localhost",
        wsPort: 8300,
        authEndpoint: "/auth"
    });
	
	pusher.connection.bind('connected', function() {
	  socketId = pusher.connection.socket_id;
	  //username = 'User' + socketId.substring(6);
	  username = 'User' + socketId;
	  updateUser();
	});

	// --- SUBSCRIBE TO COMMENTS CHANNEL -- //
	chComments = pusher.subscribe('private-comments');

	chComments.bind('client-newcomment', function(data) {
		addComment(data.username, data.comment);

		// Show notification
		if(!$("#comments").dialog('isOpen'))
		{
			$().toastmessage('showNoticeToast', data.username + ' says:<br/><br/>' + data.comment);
		}
	});

	chComments.bind('client-resolved', function(data) {
		addComment(data.username);
		isResolved = true;
		updateStatus();

		// Show notification
		if(!$("#comments").dialog('isOpen'))
		{
			$().toastmessage('showNoticeToast', data.username + ' has resolved Property 1');
		}
	});

	// --- SUBSCRIBE TO PRESENCE CHANNEL -- //
	chPresence = pusher.subscribe('presence-app');
	
	chPresence.bind('pusher:subscription_succeeded', function() {
		setupCommentsDialog();
		updateMemberList();
	});
	
	chPresence.bind('pusher:member_added', function(member) {
		updateMemberList();
	});
	
	chPresence.bind('pusher:member_removed', function(member) {
		updateMemberList();
	});

}


function setupCommentsDialog()
{
	iAmAdmin = (chPresence.members.count == 1);

	if(iAmAdmin)
	{
		$("#comments").dialog({
		  autoOpen: false,
		  title: "Comments",
		  modal: true,
		  draggable: false,
		  minHeight: 400,
		  minWidth: 500,
		  buttons: [
			{
			  text: "Resolve",
			  click: function() {
			  	resolveComments();
				$( this ).dialog( "close" );
			  }
			}
		  ]
		}).hide();
	}
	else
	{
		$("#comments").dialog({
		  autoOpen: false,
		  title: "Comments",
		  modal: true,
		  draggable: false,
		  minHeight: 400,
		  minWidth: 500
		}).hide();
	}
}

function resolveComments()
{
	if(!isResolved)
	{
		isResolved = true;
		chComments.trigger('client-resolved', { username: username });
		updateStatus();
	}
}

function updateUser()
{
	$('#username').html('Hi ' + username);
}	

function addComment(username, comment)
{
	isResolved = false;
	$('#commentList').append("<li><h5>" + username + " <span class=\"date\"> - at " + (new Date()).toLocaleTimeString() + "</span></h5><p>" + comment + "</p></li>");
	updateStatus();
}

function updateStatus()
{
	var count = $('#commentList').children().length;
	
	if(isResolved)
	{
		$('#status1').html("<span class='resolved'>Resolved</span>");
		$('#comments-btn').html('View comments');
	}
	else
	{
		if(count == 0)
		{
			//$('#status1').html("<span class='resolved'>Resolved</span>");
			$('#status1').html("<span class='ok'>Ok</span>");
			$('#comments-btn').html('Add comment');
		}
		else if(count == 1)
		{
			$('#status1').html("<span class='unresolved'>" + count + " comment</span>");
			$('#comments-btn').html('View comments');
		}
		else
		{
			$('#status1').html("<span class='unresolved'>" + count + " comments</span>");
			$('#comments-btn').html('View comments');
		}
	}
}

function updateMemberList()
{
	$('#memberList').empty();
	
	chPresence.members.each(function(member) {
		if(member.id != socketId)
		{
			$('#memberList').append('<li>User' + member.id + '</li>');
			//$('#memberList').append('<li>User' + member.id.substring(6) + '</li>');
		}
	});
	
	if(chPresence.members.count <= 1)
	{
		$('#otherviewers').html('No other viewers');
	}
	else if (chPresence.members.count == 2)
	{
		$('#otherviewers').html('1 other viewer &#x25BC;');
	}
	else
	{
		$('#otherviewers').html((chPresence.members.count -1) + ' other viewers &#x25BC;');
	}
}

function setupUI()
{
	$("#taxonomy").jstree({ "core" : { "initially_open" : [ "phtml_1", "phtml_2" ] } });
	
	$("#comments-btn").click(function(){
		$("#comments").dialog('open');
	});
	
	$('#otherviewers').click(function() {
		if(chPresence.members.count > 1)
		{
			$('#memberListWrapper').toggle();
		}
	});
	
	$('#add-comment').click(function(){
		var val = $('#comment-text').val();
		
		if(val.length > 0)
		{
			chComments.trigger('client-newcomment', { username: username, comment: val });
			$('#comment-text').val('');
			addComment(username, val);
		}
	});
}