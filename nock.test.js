var nock = require("nock");
var axios = require("axios");

getUser = function(username) {
  return axios
    .get(`https://api.github.com/users/${username}`)
    .then(res => res.data)
    .catch(error => console.log(error));
};

describe("Get User tests", () => {
  beforeEach(() => {
    nock("https://api.github.com")
      .get("/users/octocat")
      .reply(200, { name: "The", company: "GitHub" });
  });

  test("Get a user by username", () => {
    return getUser("octocat").then(response => {
      //expect an object back
      expect(typeof response).toBe("object");

      //Test result of name, company and location for the response
      expect(response.name).toBe("The");
      expect(response.company).toBe("GitHub");
    });
  });
});
