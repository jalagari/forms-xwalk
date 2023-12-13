export function submitSuccess(e, form) {
  const { data: { name, payload } } = e;
  if (payload.body.redirectUrl) {
    window.location.href = encodeURI(payload.body.redirectUrl);
  } else if (payload.body.thankYouMessage) {
    const thankYouMessage = document.createElement('div');
    thankYouMessage.setAttribute('class', 'tyMessage');
    thankYouMessage.innerHTML = payload.body.thankYouMessage;
    form.replaceWith(thankYouMessage);
  }
}

export function submitFailure(e) {

}
