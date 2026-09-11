import java.sql.*;

public class CheckThumbnails {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://ep-empty-leaf-az85xz9a-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
        String user = "neondb_owner";
        String pass = "npg_uOJlndhE9Dy7";

        try {
            Class.forName("org.postgresql.Driver");
            Connection conn = DriverManager.getConnection(url, user, pass);
            Statement stmt = conn.createStatement();

            System.out.println("=== COURSES THUMBNAILS IN ep-empty-leaf ===");
            ResultSet rs = stmt.executeQuery("SELECT id, title, thumbnail_url FROM courses");
            while (rs.next()) {
                System.out.println("ID: " + rs.getLong("id") + " | Title: " + String.format("%-30s", rs.getString("title")) + " | ThumbnailURL: " + rs.getString("thumbnail_url"));
            }
            rs.close();
            stmt.close();
            conn.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
