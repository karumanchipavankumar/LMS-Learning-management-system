import java.sql.*;

public class InspectMediaURLs {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://ep-empty-leaf-az85xz9a-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
        String user = "neondb_owner";
        String pass = "npg_uOJlndhE9Dy7";

        try {
            Class.forName("org.postgresql.Driver");
            Connection conn = DriverManager.getConnection(url, user, pass);
            Statement stmt = conn.createStatement();

            System.out.println("=== COURSES THUMBNAILS ===");
            ResultSet rs1 = stmt.executeQuery("SELECT id, title, thumbnail_url FROM courses");
            while (rs1.next()) {
                System.out.println("Course ID: " + rs1.getLong("id") + " | Title: " + rs1.getString("title") + "\n   Thumbnail: " + rs1.getString("thumbnail_url"));
            }
            rs1.close();

            System.out.println("\n=== COURSE VIDEOS ===");
            ResultSet rs2 = stmt.executeQuery("SELECT id, course_id, video_url FROM course_videos LIMIT 10");
            while (rs2.next()) {
                System.out.println("Video ID: " + rs2.getLong("id") + " | Course ID: " + rs2.getLong("course_id") + "\n   Video URL: " + rs2.getString("video_url"));
            }
            rs2.close();

            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
