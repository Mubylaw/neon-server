const { v4: uuidv4 } = require('uuid')

module.exports = ({ input, user }) => {
  let filePath
  let filename
  let contentType
  let storage = []

  switch (Array.isArray(input)) {
    case true:
      input.forEach((element) => {
        filePath = element.path
        filename = user
          ? user + element.originalname
          : uuidv4() + element.originalname
        contentType = element.mimetype
        storage.push({ filePath, filename, contentType })
      })
      break

    case false:
      if (typeof input === 'object' && Object.keys(input).length) {
        filePath = input.path
        filename = user
          ? user + input.originalname
          : uuidv4() + input.originalname
        contentType = input.mimetype
        storage = { filePath, filename, contentType }
      }
      break

    default:
      break
  }

  return storage
}
