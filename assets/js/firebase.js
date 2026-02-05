const pageScriptElement = document.currentScript;
const configEl = document.getElementById("firebase-config");

if (!configEl?.textContent) {
  console.error("Firebase config element not found");
  document
    .querySelectorAll(
      '[id^="views_"], [id^="likes_"], #button_likes_heart, #button_likes_emtpty_heart, #button_likes_text',
    )
    .forEach((el) => el.remove());
} else {
  const data = JSON.parse(configEl.textContent);
  const oid = data.oids?.views;
  const oid_likes = data.oids?.likes;

  let liked_page = false;
  const id = oid ? oid.replaceAll("/", "-") : oid;
  const id_likes = oid_likes ? oid_likes.replaceAll("/", "-") : oid_likes;

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function toggleLoaders(node) {
    var classesString = node.className;
    if (classesString == "") return;
    var classes = classesString.split(" ");
    for (var i in classes) {
      node.classList.toggle(classes[i]);
    }
  }

  var update_views = function (node, id) {
    db.collection("views")
      .doc(id)
      .onSnapshot((doc) => {
        var data = doc.data();
        if (data) {
          node.innerText = numberWithCommas(data.views);
        } else {
          node.innerText = 0;
        }
        toggleLoaders(node);
      });
  };

  var update_likes = function (node, id) {
    db.collection("likes")
      .doc(id)
      .onSnapshot((doc) => {
        var data = doc.data();
        if (data) {
          node.innerText = numberWithCommas(data.likes);
        } else {
          node.innerText = 0;
        }
        toggleLoaders(node);
      });
  };

  if (typeof auth !== "undefined") {
    const viewed = localStorage.getItem(id);

    if (!viewed && id) {
      auth
        .signInAnonymously()
        .then(() => {
          const docRef = db.collection("views").doc(id);
          localStorage.setItem(id, true);
          docRef
            .get()
            .then((doc) => {
              if (doc.exists) {
                db.collection("views")
                  .doc(id)
                  .update({
                    views: firebase.firestore.FieldValue.increment(1),
                  });
              } else {
                db.collection("views").doc(id).set({ views: 1 });
              }
            })
            .catch((error) => {
              console.log("Error getting document:", error);
            });
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error(errorCode, errorMessage);
        });
    }

    const liked = localStorage.getItem(id_likes);

    if (liked) {
      liked_page = true;
      document.querySelectorAll("span[id='button_likes_heart']")[0].style.display = "";
      document.querySelectorAll("span[id='button_likes_emtpty_heart']")[0].style.display = "none";
      document.querySelectorAll("span[id='button_likes_text']")[0].innerText = "";
    }

    auth
      .signInAnonymously()
      .then(() => {
        var views_nodes = document.querySelectorAll("span[id^='views_']");

        for (var i in views_nodes) {
          var node = views_nodes[i];
          var id = node.id ? node.id.replaceAll("/", "-") : node.id;
          if (id) {
            update_views(node, id);
          }
        }

        var likes_nodes = document.querySelectorAll("span[id^='likes_']");

        for (var i in likes_nodes) {
          var node = likes_nodes[i];
          var id = node.id ? node.id.replaceAll("/", "-") : node.id;
          if (id) {
            update_likes(node, id);
          }
        }
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error(errorCode, errorMessage);
      });
  }

  function like_article(id_likes) {
    auth
      .signInAnonymously()
      .then(() => {
        const docRef = db.collection("likes").doc(id_likes);
        docRef
          .get()
          .then((doc) => {
            liked_page = true;
            localStorage.setItem(id_likes, true);
            document.querySelectorAll("span[id='button_likes_heart']")[0].style.display = "";
            document.querySelectorAll("span[id='button_likes_emtpty_heart']")[0].style.display = "none";
            document.querySelectorAll("span[id='button_likes_text']")[0].innerText = "";
            if (doc.exists) {
              db.collection("likes")
                .doc(id_likes)
                .update({
                  likes: firebase.firestore.FieldValue.increment(1),
                });
            } else {
              db.collection("likes").doc(id_likes).set({ likes: 1 });
            }
          })
          .catch((error) => {
            console.log("Error getting document:", error);
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
      });
  }

  function remove_like_article(id_likes) {
    auth
      .signInAnonymously()
      .then(() => {
        const docRef = db.collection("likes").doc(id_likes);
        docRef
          .get()
          .then((doc) => {
            liked_page = false;
            localStorage.removeItem(id_likes);
            document.querySelectorAll("span[id='button_likes_heart']")[0].style.display = "none";
            document.querySelectorAll("span[id='button_likes_emtpty_heart']")[0].style.display = "";
            document.querySelectorAll("span[id='button_likes_text']")[0].innerText = "\xa0Like";
            if (doc.exists) {
              db.collection("likes")
                .doc(id_likes)
                .update({
                  likes: firebase.firestore.FieldValue.increment(-1),
                });
            } else {
              db.collection("likes").doc(id_likes).set({ likes: 0 });
            }
          })
          .catch((error) => {
            console.log("Error getting document:", error);
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
      });
  }

  window.process_article = function () {
    if (!liked_page) {
      like_article(id_likes);
    } else {
      remove_like_article(id_likes);
    }
  };
}
