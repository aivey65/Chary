function getUserData() {
    fetch('/dashboard/data').then(response => response.json()).then((responseData) => {
        console.log(responseData)
    })
}