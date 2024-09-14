import AuthorizeView from "./AuthorizeView";


function Home() {
    return (
        <AuthorizeView>
            <p>Hello world!</p>
        </AuthorizeView>
  );
}

export default Home;