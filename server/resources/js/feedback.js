$(document).ready(()=>{
	$('#submit').click(function(){
		$.ajax({
			url: "/email",
			type: "GET",
			data: "name=" + $("#name").val() + "&from=" + $("#email").val() + "&subject=" + $("#subject").val() + "&message=" + $("#message").val(),
			success:(res)=>{
	            window.location.href = "/feedback";
	            alert("Thanks for your feedback. We will fix it soon!")
			},
			error:(res)=>{
				alert("Issue with email");
			}
		});
	});
});