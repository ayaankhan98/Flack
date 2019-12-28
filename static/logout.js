document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#logout').onclick = () => {
        const request = new XMLHttpRequest();
        request.open('GET','/logout')
        request.onload = () => {
            const data = request.responseText
            dataframe = document.querySelector('body')
            dataframe.innerHTML = data
        }
        request.send()
        return false
    }
})