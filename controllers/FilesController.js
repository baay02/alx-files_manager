    }
    const { id } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);
    const newValue = { $set: { isPublic: false } };
    const options = { returnOriginal: false };
    files.findOneAndUpdate({ _id: idObject, userId: user._id }, newValue, options, (err, file) => {
      if (!file.lastErrorObject.updatedExisting) {
        return response.status(404).json({ error: 'Not found' });
      }
      return response.status(200).json(file.value);
    });
    return null;
  }

  static async getFile(request, response) {
    const { id } = request.params;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(id);
    files.findOne({ _id: idObject }, async (err, file) => {
      if (!file) {
        return response.status(404).json({ error: 'Not found' });
      }
      console.log(file.localPath);
      if (file.isPublic) {
        if (file.type === 'folder') {
          return response.status(400).json({ error: "A folder doesn't have content" });
        }
        try {
          let fileName = file.localPath;
          const size = request.param('size');
          if (size) {
            fileName = `${file.localPath}_${size}`;
          }
          const data = await fs.readFile(fileName);
          const contentType = mime.contentType(file.name);
          return response.header('Content-Type', contentType).status(200).send(data);
        } catch (error) {
          console.log(error);
          return response.status(404).json({ error: 'Not found' });
        }
      } else {
        const user = await FilesController.getUser(request);
        if (!user) {
          return response.status(404).json({ error: 'Not found' });
        }
        if (file.userId.toString() === user._id.toString()) {
          if (file.type === 'folder') {
            return response.status(400).json({ error: "A folder doesn't have content" });
          }
          try {
            let fileName = file.localPath;
            const size = request.param('size');
            if (size) {
              fileName = `${file.localPath}_${size}`;
            }
            const contentType = mime.contentType(file.name);
            return response.header('Content-Type', contentType).status(200).sendFile(fileName);
          } catch (error) {
            console.log(error);
            return response.status(404).json({ error: 'Not found' });
          }
        } else {
          console.log(`Wrong user: file.userId=${file.userId}; userId=${user._id}`);
          return response.status(404).json({ error: 'Not found' });
        }
      }
    });
  }
}

module.exports = FilesController;
