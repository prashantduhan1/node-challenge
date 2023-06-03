const User = require("../schema/user.schema");
const Post=require("../schema/post.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
 
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 10; // Number of documents per page
  
    try {
      // Retrieve the subset of documents based on pagination parameters
      const users = await User.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
  
      // Retrieve the number of posts for each user
      const userIds = users.map((user) => user._id);
      const postCounts = await Post.aggregate([
        {
          $match: {
            userId: { $in: userIds },
          },
        },
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 },
          },
        },
      ]);
  
      // Convert postCounts array into a map for easier lookup
      const postCountsMap = new Map(postCounts.map((count) => [count._id.toString(), count.count]));
  
      // Transform the retrieved documents into the desired output format
      const transformedUsers = users.map((user) => ({
        _id: user._id,
        name: user.name,
        posts: postCountsMap.get(user._id.toString()) || 0,
      }));
  
      // Count the total number of documents
      const totalDocs = await User.countDocuments();
  
      // Calculate pagination metadata
      const totalPages = Math.ceil(totalDocs / limit);
      const hasPrevPage = page > 1;
      const hasNextPage = page < totalPages;
      const prevPage = hasPrevPage ? page - 1 : null;
      const nextPage = hasNextPage ? page + 1 : null;
  
      // Create the final response object
  // /
       const data= {
          users: transformedUsers,
          pagination: {
            totalDocs,
            limit,
            page,
            totalPages,
            pagingCounter: (page - 1) * limit + 1,
            hasPrevPage,
            hasNextPage,
            prevPage,
            nextPage,
          },
        }
   //   };
   



    res.status(200).json({data});
  } catch (error) {
    res.send({ error: error.message });
  }
};
