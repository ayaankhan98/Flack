//  when the Document Object Model is done loading
document.addEventListener('DOMContentLoaded', () => {

    // identifies if someone clicks the logout button
    document.querySelector('#logout').onclick = () => {
        // if someone cliks the logout button then ask the server to
        // remove the user whosever is clicked the logout button
        const request = new XMLHttpRequest();

        // opening a AJAX request to the /logout route of the Flask server
        request.open('GET','/logout')

        // when the request is done loading then execute the following arrow function
        request.onload = () => {
            // getting the response which is recived form the server
            // the response text is actully the HTML page
            // this html page is the index page which is rendered by the home route of the 
            // flask server if the user logout from the website then the user is taken
            // to the homepage and this homepage is the response text form the server
            const data = request.responseText

            // the recived HTML content is rendered to the body by appeding to the body tag
            dataframe = document.querySelector('body')
            // setting the inner HTML of body to HTML page which is the response text from the server
            dataframe.innerHTML = data
        }
        
        // sending the request to the server
        request.send()
        return false
    }
})